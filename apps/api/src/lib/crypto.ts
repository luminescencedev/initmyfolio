/**
 * AES-256-GCM symmetric encryption for GitHub access tokens.
 *
 * Design choices:
 * - AES-256-GCM: authenticated encryption — ciphertext integrity is verified
 *   on decryption; any tampering is detected and rejected.
 * - Random 12-byte IV per encryption — never reuses the same IV/key pair,
 *   which would be catastrophic for GCM security.
 * - Key derived from JWT_SECRET via HKDF-SHA-256 — separates encryption key
 *   from auth key so rotating one does not break the other.
 * - Output format: base64(iv || authTag || ciphertext) — single opaque string,
 *   safe for PostgreSQL text columns.
 *
 * WARNING: rotating JWT_SECRET (or the HKDF info string below) without
 * re-encrypting stored tokens will break decryption. If you must rotate,
 * run a migration that decrypts with the old key and re-encrypts with the new.
 */
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit IV — recommended for GCM
const TAG_BYTES = 16; // 128-bit auth tag — GCM default

/** Derive a 32-byte encryption key from the application secret using HKDF. */
function deriveKey(): Buffer {
  const secret = process.env["JWT_SECRET"];
  if (!secret)
    throw new Error("[crypto] JWT_SECRET is required for token encryption");

  // HKDF-SHA-256: deterministic, domain-separated from JWT signing
  return Buffer.from(
    hkdfSync("sha256", secret, "", "github-token-encryption-v1", 32),
  );
}

/**
 * Encrypts a GitHub access token.
 * Returns a base64 string: iv (12 B) || authTag (16 B) || ciphertext.
 */
export function encryptToken(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Concatenate: iv | authTag | ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a GitHub access token previously encrypted by encryptToken().
 * Returns null if the ciphertext is invalid or tampered.
 */
export function decryptToken(ciphertext: string): string | null {
  try {
    const buf = Buffer.from(ciphertext, "base64");
    if (buf.length <= IV_BYTES + TAG_BYTES) return null;

    const iv = buf.subarray(0, IV_BYTES);
    const authTag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const encrypted = buf.subarray(IV_BYTES + TAG_BYTES);

    const key = deriveKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    // GCM auth tag mismatch or any other error → reject silently
    return null;
  }
}
