/**
 * فحص حسابات الإدارة والفروع — يقرأ الحسابات الحقيقية من قاعدة البيانات
 * ويختبر ما إذا كانت كلمات المرور الافتراضية ما زالت سارية أم تغيّرت
 */
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const db = new PrismaClient()

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(candidate, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function main() {
  console.log('\n========== حساب الإدارة العامة ==========')
  const admins = await db.admin.findMany()
  for (const a of admins) {
    const stillDefault = verifyPassword('admin123', a.passwordHash)
    console.log(`اسم المستخدم : ${a.username}`)
    console.log(`كلمة المرور  : ${stillDefault ? 'admin123  (الافتراضية — ما زالت سارية!)' : '⚠️ تغيّرت — غير معروضة هنا'}`)
    console.log(`الاسم        : ${a.name}`)
    if (a.tokenInvalidBefore) console.log(`آخر تغيير للكلمة: ${a.tokenInvalidBefore.toISOString()}`)
  }

  console.log('\n========== حسابات مكاتب الفروع ==========')
  const accounts = await db.branchAccount.findMany({
    include: { branch: { select: { name: true, slug: true, visible: true, sortOrder: true } } },
  })
  accounts.sort((x, y) => (x.branch.sortOrder ?? 0) - (y.branch.sortOrder ?? 0))
  for (const acc of accounts) {
    const stillDefault = verifyPassword('123456', acc.passwordHash)
    const vis = acc.branch.visible ? 'ظاهر' : 'مخفي'
    console.log(`${acc.username.padEnd(14)} | ${acc.branch.name.padEnd(20)} | كلمة المرور: ${stillDefault ? '123456 (افتراضية)' : '⚠️ تغيّرت'} | الفرع: ${vis}`)
  }
  console.log(`\nإجمالي حسابات الفروع: ${accounts.length}`)

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
