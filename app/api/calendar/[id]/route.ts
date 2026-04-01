import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.userId);
    const { id } = await params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event || event.createdBy !== userId) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    if (event.isLocked) {
      return NextResponse.json({ success: false, message: "Cannot edit an AUTO/Locked event" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, endDate, status } = body;

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, data: updatedEvent, message: "Event updated" });
  } catch (error: any) {
    console.error("PATCH /api/calendar/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.userId);
    const { id } = await params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event || event.createdBy !== userId) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    if (event.isLocked) {
      return NextResponse.json({ success: false, message: "Cannot delete an AUTO/Locked event" }, { status: 403 });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Event deleted", data: { id } });
  } catch (error: any) {
    console.error("DELETE /api/calendar/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
