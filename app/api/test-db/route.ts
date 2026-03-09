import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$connect();
    // Test query
    const userCount = await prisma.user.count();
    return NextResponse.json({ 
      status: "success", 
      message: "Connected to PostgreSQL database successfully",
      userCount 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to connect to database", 
      error: error.message 
    }, { status: 500 });
  } finally {
      await prisma.$disconnect();
  }
}
