import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// Create new invoice
router.post("/create", async (req, res) => {
  try {
    console.log("📥 Incoming invoice:", req.body);
    const {
      customer_id,
      items,
      total_amount,
      transaction_status,
      paid_amount,
    } = req.body;

    if (!customer_id || !items || items.length === 0)
      return res
        .status(400)
        .json({ message: "Customer and items are required" });

    const result = await pool.query(
      `INSERT INTO invoices (customer_id, items, total_amount, transaction_status, paid_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        customer_id,
        JSON.stringify(items),
        total_amount,
        transaction_status,
        paid_amount,
      ]
    );

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: result.rows[0],
    });
  } catch (err) {
    console.error(" Error creating invoice:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//  Get all invoices
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT invoices.*, customers.name AS customer_name,customers.mobile AS customer_phone, customers.email AS customer_email
      FROM invoices
      LEFT JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.id DESC;
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(" Error fetching invoices:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//  Get invoice by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT invoices.*, customers.name AS customer_name, customers.mobile AS customer_phone, customers.email AS customer_email
       FROM invoices
       LEFT JOIN customers ON invoices.customer_id = customers.id
       WHERE invoices.id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(" Error fetching invoice:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//  Update invoice
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { items, total_amount, transaction_status, paid_amount, date } = req.body;

    const result = await pool.query(
      `UPDATE invoices 
       SET items = $1, total_amount = $2, transaction_status = $3, paid_amount = $4, date = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [
        JSON.stringify(items),
        total_amount,
        transaction_status,
        paid_amount,
        date,
        id,
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json({
      message: "Invoice updated successfully",
      invoice: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating invoice:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
//  Delete invoice
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM invoices WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error(" Error deleting invoice:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
