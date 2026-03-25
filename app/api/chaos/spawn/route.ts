import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST() {
  const scriptPath = path.join(process.cwd(), "scripts", "mock-chaos-agent.js");

  const child = spawn("node", [scriptPath], {
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  return NextResponse.json({ status: "Agent Infiltrated" }, { status: 200 });
}

