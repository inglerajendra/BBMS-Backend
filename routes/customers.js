import express from "express";
import pool from "../config/db.js";

const router = express.Router();

//  Get all customers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Error fetching customers" });
  }
});

//  Create a new customer
router.post("/", async (req, res) => {
  const { name, email, mobile } = req.body;
  if (!name || !email || !mobile)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const result = await pool.query(
      "INSERT INTO customers (name, email, mobile) VALUES ($1, $2, $3) RETURNING *",
      [name, email, mobile]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating customer:", err);
    res.status(500).json({ message: "Error creating customer" });
  }
});

//  Update a customer
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile } = req.body;

  try {
    const result = await pool.query(
      "UPDATE customers SET name=$1, email=$2, mobile=$3 WHERE id=$4 RETURNING *",
      [name, email, mobile, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).json({ message: "Error updating customer" });
  }
});

//  Delete a customer
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM customers WHERE id=$1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ message: "Error deleting customer" });
  }
});

export default router;
