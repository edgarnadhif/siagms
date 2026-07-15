import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getErrorStatus, requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth(["ADMIN"]);
    const userCount = await prisma.user.count({
      where: { tenantId: auth.tenantId },
    });
    return NextResponse.json({ 
      status: "success", 
      message: "Connected to PostgreSQL database successfully",
      userCount 
    });
  } catch (error: unknown) {
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to connect to database",
    }, { status: getErrorStatus(error) });
  }
}
