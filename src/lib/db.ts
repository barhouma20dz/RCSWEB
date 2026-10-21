import { PrismaClient } from '@prisma/client'
import { copyFileSync, existsSync } from 'fs'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * مسار قاعدة البيانات:
 * - محلياً: DATABASE_URL من .env دون أي تغيير عن الإعداد الأصلي.
 * - على Vercel: نظام الملفات للقراءة فقط عدا /tmp، لذا ننسخ قاعدة البيانات
 *   المرفقة مع النشر (db/custom.db المُعبّأة أثناء البناء) إلى /tmp —
 *   المكان الوحيد القابل للكتابة داخل دوال السيرفر (Serverless Functions).
 */
function resolveDatabaseUrl(): string {
  if (process.env.VERCEL === '1') {
    const bundled = path.join(process.cwd(), 'db', 'custom.db')
    const target = '/tmp/custom.db'
    try {
      if (!existsSync(target) && existsSync(bundled)) {
        copyFileSync(bundled, target)
      }
    } catch {
      // عند فشل النسخ نُكمل بالمسار المستهدف على أي حال
    }
    return `file:${target}`
  }
  return process.env.DATABASE_URL || 'file:../db/custom.db'
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    // سجلات الاستعلامات في بيئة التطوير فقط (تقليل الضجيج في سجلات Vercel)
    log: process.env.NODE_ENV === 'production' ? [] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
