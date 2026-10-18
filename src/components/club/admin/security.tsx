'use client'

/**
 * تبويب الأمان والحسابات — الإدارة العامة
 * - تغيير كلمة مرور الإدارة (مع إبطال فوري لكل الجلسات القديمة)
 * - تنبيه إذا كانت كلمة المرور الافتراضية ما زالت مستخدمة
 * - سجل الأحداث الأمنية (دخول ناجح/فاشل، قفل حسابات، تجاوز حدود، تغيير كلمات المرور)
 * - ملخص إجراءات الحماية المطبقة على الموقع
 */

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  ScrollText,
  Lock,
  LogIn,
  UserX,
  TimerReset,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { formatDateDMY } from '@/lib/date-format'

interface SecurityEventItem {
  id: string
  type: string
  actor: string | null
  ip: string | null
  detail: string | null
  createdAt: string
}

interface SecurityPayload {
  usingDefaultPassword: boolean
  stats: { failedLogins7d: number; lockedAccounts7d: number; totalEvents: number }
  events: SecurityEventItem[]
}

/** خريطة أنواع الأحداث → عرض */
const EVENT_META: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  login_success: { label: 'دخول ناجح', cls: 'bg-green-500/12 text-green-700 dark:text-green-300 border-green-500/30', icon: LogIn },
  login_failed: { label: 'محاولة دخول فاشلة', cls: 'bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/30', icon: UserX },
  login_locked: { label: 'قفل حساب مؤقت', cls: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30', icon: Lock },
  rate_limited: { label: 'تجاوز حد الطلبات', cls: 'bg-orange-500/12 text-orange-700 dark:text-orange-300 border-orange-500/30', icon: TimerReset },
  password_changed: { label: 'تغيير كلمة مرور', cls: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', icon: KeyRound },
  password_reset: { label: 'إعادة تعيين كلمة مرور', cls: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/30', icon: RefreshCw },
  invalid_token: { label: 'توكن غير صالح', cls: 'bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/30', icon: ShieldAlert },
}

function passwordStrength(pw: string): { label: string; cls: string; width: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'ضعيفة', cls: 'bg-red-500', width: '20%' }
  if (score === 2) return { label: 'متوسطة', cls: 'bg-amber-500', width: '45%' }
  if (score === 3) return { label: 'جيدة', cls: 'bg-yellow-500', width: '65%' }
  if (score === 4) return { label: 'قوية', cls: 'bg-green-500', width: '85%' }
  return { label: 'قوية جداً', cls: 'bg-emerald-600', width: '100%' }
}

export function SecurityManager() {
  const { toast } = useToast()
  const [data, setData] = useState<SecurityPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/security')
      if (res.status === 401) {
        toast({ title: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً', variant: 'destructive' })
        return
      }
      const d = (await res.json()) as SecurityPayload
      setData(d)
    } catch {
      toast({ title: 'فشل تحميل الحالة الأمنية', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.current || !form.next) return
    if (form.next !== form.confirm) {
      toast({ title: 'كلمة المرور الجديدة والتأكيد غير متطابقين', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'فشل تغيير كلمة المرور')
      toast({ title: 'تم تغيير كلمة المرور بنجاح — كل الجلسات القديمة أُبطلت', description: 'احتفظ بكلمة المرور الجديدة في مكان آمن' })
      setForm({ current: '', next: '', confirm: '' })
      void load()
    } catch (err) {
      toast({ title: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const strength = passwordStrength(form.next)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-(--club-dark) flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-green-600" />
          الأمان والحسابات
        </h2>
        <p className="text-sm text-muted-foreground mt-1">حماية حسابات النادي وبياناته — كلمات المرور، الجلسات، وسجل الأحداث الأمنية</p>
      </div>

      {/* تنبيه كلمة المرور الافتراضية */}
      {data?.usingDefaultPassword && (
        <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/8 p-4 flex items-start gap-3" role="alert">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-red-700 dark:text-red-300">كلمة المرور الافتراضية ما زالت مستخدمة!</p>
            <p className="text-sm text-red-700/80 dark:text-red-300/80 mt-1">
              حساب الإدارة ما زال يعمل بكلمة المرور الافتراضية — أي شخص يعرفها يمكنه دخول لوحة إدارة النادي بالكامل.
              غيّرها الآن من النموذج أدناه.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* تغيير كلمة المرور */}
        <section className="rounded-2xl bg-white border border-(--border) p-5">
          <h3 className="font-black text-(--club-dark) flex items-center gap-2 mb-1">
            <KeyRound className="h-5 w-5 text-primary" />
            تغيير كلمة مرور الإدارة
          </h3>
          <p className="text-xs text-muted-foreground mb-4">عند التغيير تُبطل كل الجلسات النشطة الأخرى فوراً — على كل الأجهزة</p>

          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sec-current">كلمة المرور الحالية</Label>
              <div className="relative">
                <Input
                  id="sec-current"
                  type={showCurrent ? 'text' : 'password'}
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                  className="pl-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrent ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sec-next">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="sec-next"
                  type={showNew ? 'text' : 'password'}
                  value={form.next}
                  onChange={(e) => setForm({ ...form, next: e.target.value })}
                  className="pl-10"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.next && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.cls}`} style={{ width: strength.width }} />
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground mt-1">قوة كلمة المرور: {strength.label}</p>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">8 أحرف على الأقل — حرف إنجليزي + رقم</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sec-confirm">تأكيد كلمة المرور الجديدة</Label>
              <Input
                id="sec-confirm"
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" disabled={saving || !form.current || !form.next || !form.confirm} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <KeyRound className="h-4 w-4 ml-1" />}
              {saving ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
            </Button>
          </form>
        </section>

        {/* ملخص الحماية والإحصائيات */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-white border border-(--border) p-5">
            <h3 className="font-black text-(--club-dark) flex items-center gap-2 mb-3">
              <Lock className="h-5 w-5 text-primary" />
              إجراءات الحماية المطبقة
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                'تشفير كلمات المرور scrypt بملح عشوائي لكل حساب',
                'توكنات جلسة موقّعة HMAC-SHA256 بمفتاح سري من بيئة التشغيل',
                'قفل مؤقت للحساب بعد 5 محاولات دخول خاطئة (10 دقائق)',
                'حد طلبات على تسجيل الدخول والنماذج العامة (مضاد القوة الغاشمة والإغراق)',
                'عزل بيانات كل فرع عن غيره على مستوى الخادم',
                'إبطال فوري لكل الجلسات عند تغيير كلمة المرور',
                'مدة الجلسة 24 ساعة (تقليص نافذة السرقة)',
                'استعلام حالة الانخراط يتطلب الهاتف + اللقب معاً (خصوصية)',
                'ترويسات أمان HTTP ضد تخمين المحتوى وتسريب المعلومات',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-(--club-dark)/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white border border-(--border) p-4 text-center">
              <div className="text-2xl font-black text-(--club-dark)">{data?.stats.failedLogins7d ?? 0}</div>
              <div className="text-[11px] font-bold text-muted-foreground mt-1">محاولات فاشلة (7 أيام)</div>
            </div>
            <div className="rounded-2xl bg-white border border-(--border) p-4 text-center">
              <div className="text-2xl font-black text-(--club-dark)">{data?.stats.lockedAccounts7d ?? 0}</div>
              <div className="text-[11px] font-bold text-muted-foreground mt-1">أقفال حسابات (7 أيام)</div>
            </div>
            <div className="rounded-2xl bg-white border border-(--border) p-4 text-center">
              <div className="text-2xl font-black text-(--club-dark)">{data?.stats.totalEvents ?? 0}</div>
              <div className="text-[11px] font-bold text-muted-foreground mt-1">حدث مسجل (آخر 100)</div>
            </div>
          </div>
        </section>
      </div>

      {/* سجل الأحداث الأمنية */}
      <section className="rounded-2xl bg-white border border-(--border) p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-black text-(--club-dark) flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            سجل الأحداث الأمنية
          </h3>
          <Button onClick={() => void load()} variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5 ml-1" />
            تحديث
          </Button>
        </div>

        {!data?.events.length ? (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-6 text-center">
            لا أحداث مسجلة بعد — ستظهر هنا كل عمليات الدخول والمحاولات الفاشلة وتغييرات كلمات المرور
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto nice-scroll space-y-2" role="log" aria-label="سجل الأحداث الأمنية">
            {data.events.map((ev) => {
              const meta = EVENT_META[ev.type] ?? { label: ev.type, cls: 'bg-muted text-muted-foreground border-border', icon: ScrollText }
              const Icon = meta.icon
              return (
                <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-(--border) bg-paper/30 px-3 py-2.5">
                  <Badge className={`${meta.cls} border font-bold text-[11px] shrink-0`} variant="outline">
                    <Icon className="h-3 w-3 ml-1" />
                    {meta.label}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-(--club-dark) truncate" dir="auto">
                      {ev.actor || '—'} {ev.detail ? <span className="font-normal text-muted-foreground">· {ev.detail}</span> : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground" dir="ltr">
                      {formatDateDMY(ev.createdAt)} · {ev.ip || '—'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </motion.div>
  )
}
