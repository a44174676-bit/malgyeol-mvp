import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

const HASH_VERSION = "v1";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 256;

function isAcceptablePasswordLength(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
}

export async function hashCarePassword(password: string): Promise<string> {
  if (!isAcceptablePasswordLength(password)) {
    throw new Error("비밀번호 길이가 정책을 충족하지 않습니다.");
  }
  const salt = randomBytes(SALT_BYTES);
  const derived = await deriveKey(password, salt);
  return [
    "scrypt",
    HASH_VERSION,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

export async function verifyCarePassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || password.length > MAX_PASSWORD_LENGTH || !storedHash) {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 7) return false;

  const [scheme, version, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  if (scheme !== "scrypt" || version !== HASH_VERSION) return false;

  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (n <= 0 || r <= 0 || p <= 0) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(hashB64, "base64");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = await scryptAsync(password, salt, expected.length, { N: n, r, p });
  } catch {
    return false;
  }

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export const CARE_PASSWORD_MIN_LENGTH = MIN_PASSWORD_LENGTH;
export const CARE_PASSWORD_MAX_LENGTH = MAX_PASSWORD_LENGTH;
