import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function POST(request: NextRequest) {
  const rawSecret = process.env["JWT_SECRET"];
  if (!rawSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }
  const secret = new TextEncoder().encode(rawSecret);

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

  // revalidatePath purges both the Full Route Cache (ISR) and the
  // Data Cache for all fetch() calls within that path — no need for
  // revalidateTag separately.
  revalidatePath(`/${username}`);

  return NextResponse.json({ revalidated: true });
}
