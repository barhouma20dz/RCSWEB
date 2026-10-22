import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })

  const sql = readFileSync(process.env.SQL_FILE || '/tmp/turso-schema.sql', 'utf-8')
  // أسطر التعليق (-- و/* */) قد تتخلل كل أمر — نزيلها من الداخل ثم نحتفظ بالأوامر الفعلية فقط
  const stmts = sql
    .split(/;\s*\n/)
    .map((chunk) =>
      chunk
        .split('\n')
        .filter((line) => !line.trim().startsWith('--') && !line.trim().startsWith('/*'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0)

  console.log(`تنفيذ ${stmts.length} أمر إنشاء...`)
  for (const stmt of stmts) {
    await client.execute(stmt)
  }
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log('الجداول:', tables.rows.map((r) => r.name).join(', '))
}

main()
