import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const { filter } = req.query;
    
    // Strict allowlist for filter to prevent SQL injection risks from string concatenation
    const allowedFilters = ["this_month", "last_month", "this_year", "all_time", ""];
    if (filter && !allowedFilters.includes(filter)) {
      return res.status(400).json({ error: "Invalid filter parameter" });
    }

    let dateFilter = "";
    if (filter === "this_month") {
      dateFilter = "EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
    } else if (filter === "last_month") {
      dateFilter = "EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')";
    } else if (filter === "this_year") {
      dateFilter = "EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
    }

    const whereClause = dateFilter ? `WHERE ${dateFilter}` : "";

    // Queries
    const customersQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const invoicesCountQuery = `SELECT COUNT(*) FROM invoices ${whereClause}`;
    const revenueQuery = `SELECT SUM(paid_amount) FROM invoices ${whereClause}`;
    const expensesQuery = `SELECT SUM(amount) FROM expenses ${whereClause}`;
    const unpaidInvoicesQuery = `SELECT COUNT(*) FROM invoices WHERE transaction_status = 'unpaid' ${dateFilter ? `AND ${dateFilter}` : ""}`;
    
    const recentInvoicesQuery = `
      SELECT i.id, c.name as customer_name, i.total_amount, i.transaction_status, i.created_at
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 20
    `; // Note: recent invoices typically aren't filtered by the date range, they just show the most recent across all time, or we can filter them too. Let's just show top 10 most recent regardless of filter, or actually maybe it's better to show them. I'll just show the global 10 most recent.

    const [
      customersRes,
      invoicesCountRes,
      revenueRes,
      expensesRes,
      unpaidRes,
      recentInvoicesRes
    ] = await Promise.all([
      pool.query(customersQuery),
      pool.query(invoicesCountQuery),
      pool.query(revenueQuery),
      pool.query(expensesQuery),
      pool.query(unpaidInvoicesQuery),
      pool.query(recentInvoicesQuery)
    ]);

    const totalCustomers = parseInt(customersRes.rows[0].count) || 0;
    const totalInvoices = parseInt(invoicesCountRes.rows[0].count) || 0;
    const totalRevenue = parseFloat(revenueRes.rows[0].sum) || 0;
    const totalExpenses = parseFloat(expensesRes.rows[0].sum) || 0;
    const unpaidInvoices = parseInt(unpaidRes.rows[0].count) || 0;
    const profitLoss = totalRevenue - totalExpenses;
    const recentInvoices = recentInvoicesRes.rows;

    res.json({
      totalCustomers,
      totalInvoices,
      totalRevenue,
      totalExpenses,
      unpaidInvoices,
      profitLoss,
      recentInvoices
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
