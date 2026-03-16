import { Request, Response } from "express";
import { pool } from "../db/postgres";

export const logPeriod = async (req: Request, res: Response) => {

  try {

    const user = (req as any).user;

    const { start_date, end_date, flow, pain_level } = req.body;

    await pool.query(
      `INSERT INTO period_logs
      (user_id,start_date,end_date,flow,pain_level)
      VALUES ($1,$2,$3,$4,$5)`,
      [
        user.id,
        start_date,
        end_date,
        flow,
        pain_level
      ]
    );

    res.json({ success: true });

  } catch (err) {

    console.error("PERIOD LOG ERROR:", err);
    res.status(500).json({ error: "Log failed" });

  }

};