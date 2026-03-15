import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = 1;

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { id: USER_ID } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, role, industry, tone, topics, postingGoal } = body;

    const updated = await prisma.user.upsert({
      where: { id: USER_ID },
      update: {
        name: name ?? undefined,
        role: role ?? undefined,
        industry: industry ?? undefined,
        tone: tone ?? undefined,
        topics: topics ?? undefined,
        postingGoal: postingGoal ?? undefined,
      },
      create: {
        id: USER_ID,
        name: name ?? "Your Name",
        email: "you@example.com",
        role: role ?? "",
        industry: industry ?? "",
        tone: tone ?? "professional",
        topics: topics ?? "",
        postingGoal: postingGoal ?? "",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/profile]", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
