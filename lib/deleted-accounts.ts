import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "deleted-accounts.json")

export interface DeletedAccount {
  email: string
  name: string | null
  deletedAt: number // Unix seconds
  reason: "self_deleted"
}

interface DeletedStore {
  deleted: DeletedAccount[]
}

async function readStore(): Promise<DeletedStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as DeletedStore
    return Array.isArray(data?.deleted) ? data : { deleted: [] }
  } catch {
    return { deleted: [] }
  }
}

async function writeStore(store: DeletedStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function logDeletedAccount(account: Omit<DeletedAccount, "deletedAt">): Promise<void> {
  const store = await readStore()
  store.deleted.push({ ...account, deletedAt: Math.floor(Date.now() / 1000) })
  await writeStore(store)
}

export async function getDeletedAccounts(): Promise<DeletedAccount[]> {
  const store = await readStore()
  return store.deleted.sort((a, b) => b.deletedAt - a.deletedAt)
}
