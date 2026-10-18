import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, SESSION_COOKIE, clientIp, logSecurityEvent } from '@/lib/auth'
import { loginIpLimit, isLoginLocked, registerLoginFailure, clearLoginFailures } from '@/lib/rate-limit'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 24 ساعة — متزامنة مع مدة التوكن
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req)

    // ===== حد IP العام (يحصر تعداد المستخدمين وإغراق الخادم) =====
    const ipLimit = loginIpLimit(ip)
    if (!ipLimit.allowed) {
      await logSecurityEvent('rate_limited', null, ip, `تسجيل دخول: تجاوز حد المحاولات من نفس العنوان`)
      return NextResponse.json(
        { error: `محاولات كثيرة جداً — يرجى الانتظار ${Math.ceil(ipLimit.retryAfter / 60)} دقيقة ثم إعادة المحاولة` },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      )
    }

    const body = await req.json().catch(() => null)
    const username = String(body?.username ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!username || !password) {
      return NextResponse.json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 })
    }

    // ===== قفل الحساب بعد إخفاقات متكررة (قوة غاشمة لكل مستخدم+IP) =====
    const locked = isLoginLocked(ip, username)
    if (!locked.allowed) {
      await logSecurityEvent('login_locked', username, ip, `حساب مقفل مؤقتاً بعد إخفاقات متكررة`)
      return NextResponse.json(
        { error: `تم إيقاف تسجيل الدخول لهذا الحساب مؤقتاً بسبب محاولات خاطئة متكررة — أعد المحاولة بعد ${Math.ceil(locked.retryAfter / 60)} دقيقة` },
        { status: 429, headers: { 'Retry-After': String(locked.retryAfter) } }
      )
    }

    // محاولة الدخول بحساب مكتب الفرع أولاً
    const account = await db.branchAccount.findUnique({
      where: { username },
      include: { branch: true },
    })

    if (account && verifyPassword(password, account.passwordHash)) {
      clearLoginFailures(ip, username)
      const token = createToken('office', account.id, account.branchId)
      await logSecurityEvent('login_success', username, ip, 'دخول مكتب فرع')
      const res = NextResponse.json({
        success: true,
        role: 'office',
        token,
        account: {
          username: account.username,
          branch: {
            id: account.branch.id,
            slug: account.branch.slug,
            name: account.branch.name,
            motto: account.branch.motto,
            color: account.branch.color,
            image: account.branch.image,
          },
        },
      })
      res.cookies.set(SESSION_COOKIE, token, cookieOptions)
      return res
    }

    // محاولة الدخول بحساب الإدارة المركزية
    const admin = await db.admin.findUnique({ where: { username } })
    if (admin && verifyPassword(password, admin.passwordHash)) {
      clearLoginFailures(ip, username)
      const token = createToken('admin', admin.id)
      await logSecurityEvent('login_success', username, ip, 'دخول الإدارة العامة')
      const res = NextResponse.json({
        success: true,
        role: 'admin',
        token,
        admin: { username: admin.username, name: admin.name },
      })
      res.cookies.set(SESSION_COOKIE, token, cookieOptions)
      return res
    }

    // ===== إخفاق: تسجيل الحدث وزيادة العداد =====
    registerLoginFailure(ip, username)
    await logSecurityEvent('login_failed', username, ip, 'بيانات دخول غير صحيحة')

    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 })
  }
}
