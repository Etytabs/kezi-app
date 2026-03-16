import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/postgres";
import { generateToken } from "../utils/jwt";

/* ============================= */
/* REGISTER */
/* ============================= */

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Vérifier champs obligatoires
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Vérifier si utilisateur existe
    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user (⚠️ password et pas password_hash)
    const result = await pool.query(
      `INSERT INTO users (email, password, name)
       VALUES ($1,$2,$3)
       RETURNING id,email,name`,
      [email, hashedPassword, name || "User"]
    );

    const user = result.rows[0];

    // JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.json({
      user,
      token
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

/* ============================= */
/* LOGIN */
/* ============================= */

export const login = async (req: Request, res: Response) => {
  try {

    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ⚠️ password et pas password_hash
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
};