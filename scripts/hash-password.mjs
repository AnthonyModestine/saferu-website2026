/**
 * Generate a scrypt password hash for ADMIN_PASSWORD_HASH or manual admin setup.
 * Usage: node scripts/hash-password.mjs "your-password"
 */
import { scrypt, randomBytes } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scrypt)
const SALT_LEN = 16
const KEY_LEN = 64

async function hashPassword(plain) {
  const salt = randomBytes(SALT_LEN)
  const hash = await scryptAsync(plain, salt, KEY_LEN)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"')
  process.exit(1)
}

const hash = await hashPassword(password)
console.log(hash)
