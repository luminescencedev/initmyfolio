import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env["JWT_SECRET"] ?? "dev-secret-please-change-in-production-32chars"
);

export interface JWTPayload {
  userId: string;
  username: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload["userId"] as string,
      username: payload["username"] as string,
    };
  } catch {
    return null;
  }
}
