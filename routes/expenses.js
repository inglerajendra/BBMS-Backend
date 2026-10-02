import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// Get all expenses
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add new expense
router.post("/", async (req, res) => {
  try {
    const { name, amount, payment_status, paid_amount } = req.body;

    const result = await pool.query(
      `INSERT INTO expenses (name, amount, payment_status, paid_amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, amount, payment_status, paid_amount]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding expense:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Update expense
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, payment_status, paid_amount } = req.body;

    const result = await pool.query(
      `UPDATE expenses
       SET name = $1, amount = $2, payment_status = $3, paid_amount = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name, amount, payment_status, paid_amount, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Expense not found" });

    res.status(200).json({
      message: "Expense updated successfully",
      expense: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating expense:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete expense
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM expenses WHERE id = $1", [req.params.id]);
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
