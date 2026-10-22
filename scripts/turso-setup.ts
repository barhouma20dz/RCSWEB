import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })

  const sql = readFileSync(process.env.SQL_FILE || '/tmp/turso-schema.sql', 'utf-8')
  const stmts = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

  console.log(`تنفيذ ${stmts.length} أمر إنشاء...`)
  for (const stmt of stmts) {
    await client.execute(stmt)
  }
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log('الجداول:', tables.rows.map((r) => r.name).join(', '))
}

main()
