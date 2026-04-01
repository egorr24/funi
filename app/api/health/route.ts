import { NextResponse } from "next/server";
import { pool } from "@/models/database.js";

export async function GET() {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message || error.toString(),
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
