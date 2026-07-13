import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AppSettings from "@/models/AppSettings";

export async function POST(req: Request) {
  await connectDB();
  const { clientId, clientSecret } = await req.json() as {
    clientId: string;
    clientSecret: string;
  };

  await AppSettings.findOneAndUpdate(
    {},
    { $set: { googleClientId: clientId.trim(), googleClientSecret: clientSecret.trim() } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
