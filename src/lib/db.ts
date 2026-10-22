import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { copyFileSync, existsSync } from 'fs'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * مسار قاعدة البيانات (بترتيب الأولوية):
 *
 * 1) Turso (الإنتاج الدائم): عند توفر TURSO_DATABASE_URL يُستخدم محرك libSQL —
 *    قاعدة بيانات حقيقية مستحدة على السحابة، كل التعديلات دائمة ومشتركة بين كل النسخ.
 *
 * 2) Vercel بدون Turso: نظام الملفات للقراءة فقط عدا /tmp — ننسخ قاعدة البيانات
 *    المرفقة مع النشر (db/custom.db المُعبأة أثناء البناء) إلى /tmp (بيئة عرض مؤقتة).
 *
 * 3) محلياً: DATABASE_URL من .env دون أي تغيير عن الإعداد الأصلي.
 */
function resolveLocalDatabaseUrl(): string {
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

function createDatabaseClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL

  // ===== 1) Turso — قاعدة دائمة على السحابة =====
  if (tursoUrl) {
    // إصدار @prisma/adapter-libsql ‏6.x يستقبل كائن الإعدادات نفسه ويُنشئ العميل داخلياً
    return new PrismaClient({
      adapter: new PrismaLibSQL({
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
      // سجلات الاستعلامات في بيئة التطوير فقط
      log: process.env.NODE_ENV === 'production' ? [] : ['query'],
    })
  }

  // ===== 2/3) SQLite محلي أو مرفق مع Vercel =====
  return new PrismaClient({
    datasourceUrl: resolveLocalDatabaseUrl(),
    log: process.env.NODE_ENV === 'production' ? [] : ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createDatabaseClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
