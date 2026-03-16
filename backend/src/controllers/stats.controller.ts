import { Request, Response } from "express";
import { pool } from "../db/postgres";

export const getStats = async (req: Request, res: Response) => {

  try {

    const user = (req as any).user;

    const result = await pool.query(
      `SELECT
        AVG(cycle_length) as avg_cycle,
        AVG(period_length) as avg_period,
        COUNT(*) as total_cycles
       FROM cycles
       WHERE user_id=$1`,
      [user.id]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error("STATS ERROR:", err);
    res.status(500).json({ error: "Stats failed" });

  }

};