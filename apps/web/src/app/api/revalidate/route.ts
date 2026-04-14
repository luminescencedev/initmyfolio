import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env["JWT_SECRET"] ?? "dev-secret-please-change-in-production-32chars",
);

export async function POST(request: NextRequest) {
  // Verify the user's bearer token so only authenticated users can revalidate,
  // and only their own portfolio path.
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let username: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    username = payload["username"] as string;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  revalidatePath(`/${username}`);

  return NextResponse.json({ revalidated: true });
}
