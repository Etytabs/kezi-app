import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/postgres";
import { generateToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Vérifier que les champs existent
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion utilisateur
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id,email",
      [email, hashedPassword]
    );

    const user = result.rows[0];

    // Générer JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.json({ token });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};
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

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.json({ token });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
};