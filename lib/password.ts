"use server"

import { scrypt, randomBytes, timingSafeEqual } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scrypt)
const SALT_LEN = 16
const KEY_LEN = 64

/** Hash a password for storage. Never store the result in admin UI or exports. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN)
  const hash = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

/** Verify a plain password against a stored hash. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const hash = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer
  const expected = Buffer.from(hashHex, "hex")
  const actual = hash
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
