export type MetricsStorageMeta = {
  storage: "postgres" | "file"
  reason?: "missing_env" | "connection_failed"
  envVar?: string | null
}

export function getMetricsStorageWarning(meta: MetricsStorageMeta): string | null {
  if (meta.storage === "postgres") return null
  if (meta.reason === "connection_failed") {
    return meta.envVar
      ? `${meta.envVar} is set but the database did not respond. Check that your Neon project is active, then redeploy on Vercel.`
      : "Database credentials are set but the connection failed. Check Neon and redeploy on Vercel."
  }
  return "Neon is not linked to this site on Vercel. In Vercel → Storage → your Neon database → Connect to Project, select this website project, enable Production and Preview, save, then redeploy."
}
