import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;
    const tenantId = session.tenantId;

    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month"); // 1-12
    const yearStr = searchParams.get("year");
    const isUpcoming = searchParams.get("upcoming") === "true";

    let startDate: Date;
    let endDate: Date;

    if (monthStr && yearStr) {
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // 0-indexed in JS
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    } else if (searchParams.get("start") && searchParams.get("end")) {
      startDate = new Date(searchParams.get("start") as string);
      endDate = new Date(searchParams.get("end") as string);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    let userEvents = [];
    
    if (isUpcoming) {
      userEvents = await prisma.calendarEvent.findMany({
        where: {
          tenantId,
          createdBy: userId,
          date: {
            gte: new Date(),
          },
        },
        orderBy: {
          date: "asc",
        },
        take: 5,
      });
    } else {
      userEvents = await prisma.calendarEvent.findMany({
        where: {
          tenantId,
          createdBy: userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: "asc",
        },
      });
    }

    return NextResponse.json({ success: true, data: userEvents, message: "Events fetched successfully" });
  } catch (error: any) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;
    const tenantId = session.tenantId;

    const body = await req.json();
    const { title, description, date, endDate, type } = body;

    if (!title || !date) {
      return NextResponse.json({ success: false, message: "Title and Date are required" }, { status: 400 });
    }

    if (type !== "MANUAL") {
      return NextResponse.json({ success: false, message: "Can only create MANUAL events via POST" }, { status: 400 });
    }

    const newEvent = await prisma.calendarEvent.create({
      data: {
        tenantId,
        title,
        description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        type: "MANUAL",
        status: "PENDING",
        isLocked: false,
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, data: newEvent, message: "Event created" }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/calendar error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
