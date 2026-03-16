import { Request, Response } from "express";
import { pool } from "../db/postgres";

export const getProfile = async (req: Request, res: Response) => {

  try {

    const user = (req as any).user;

    const result = await pool.query(
      `SELECT id,email,created_at
       FROM users
       WHERE id=$1`,
      [user.id]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error("PROFILE ERROR:", err);
    res.status(500).json({ error: "Profile failed" });

  }

};