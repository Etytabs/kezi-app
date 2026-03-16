import { Request, Response } from "express";
import { pool } from "../db/postgres";

export const getCalendar = async (req: Request, res: Response) => {

  try {

    const user = (req as any).user;

    const periods = await pool.query(
      `SELECT start_date,end_date
       FROM period_logs
       WHERE user_id=$1
       ORDER BY start_date DESC
       LIMIT 6`,
      [user.id]
    );

    const cycles = await pool.query(
      `SELECT cycle_length,ovulation_day,fertile_start,fertile_end
       FROM cycles
       WHERE user_id=$1
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    res.json({
      periods: periods.rows,
      cycle: cycles.rows[0] || null
    });

  } catch (err) {

    console.error("CALENDAR ERROR:", err);
    res.status(500).json({ error: "Calendar failed" });

  }

};