'use client'

/**
 * قسم الانضمام — استمارة طلب الانخراط الموسمي
 * بطاقات اختيار الفرع (يُرسل الطلب مباشرة إلى مكتب الفرع المحدد)
 *
 * بنية الاستمارة حسب العمر (يُحسب آلياً من تاريخ الميلاد):
 * - معلومات المنخرط: الاسم الشخصي، اللقب، الجنس، تاريخ الميلاد (يوم/شهر/سنة)
 * - أقل من سن الرشد (18 افتراضياً): خانات معلومات ولي الأمر
 *   (الاسم الكامل لولي الأمر، العنوان، رقم الهاتف)
 * - سن الرشد فما فوق: العنوان الشخصي، رقم الهاتف
 *
 * كل إعدادات النافذة (سن الرشد، إظهار/إلزامية الحقول، العناوين، الإشعار)
 * تُضبط من حساب الإدارة العامة → إعدادات الواجهة → استمارة الانخراط
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  UserPlus,
  CheckCircle2,
  BadgeCheck,
  Search,
  ClipboardList,
  CalendarRange,
  Check,
  User,
  Users,
  Cake,
  Phone,
  Send,
  Home,
  Info,
  ShieldCheck,
  FileSignature,
  FileDown,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BranchIcon } from './icon-map'
import { useT, useLang } from './i18n'
import { useSiteSettings, useSectionTexts } from './site-store'
import { formatDateDMY } from '@/lib/date-format'
import { useToast } from '@/hooks/use-toast'
import type { BranchSummary } from './types'
import { ParentAuthorizationDialog, type AuthorizationData } from './system-papers'
import {
  EnrollmentFormDialog,
  enrollmentFromItem,
  type EnrollmentFormData,
} from './enrollment-form'

/** رموز الفروع المعروضة على البطاقات */
const BRANCH_CODES: Record<string, string> = {
  football: 'FOOT-RCS',
  basketball: 'BASKET-RCS',
  handball: 'HAND-RCS',
  volleyball: 'VOLLEY-RCS',
  athletics: 'ATHL-RCS',
  'martial-arts': 'COMBAT-RCS',
  swimming: 'SWIM-RCS',
  'table-tennis': 'TENNIS-RCS',
  chess: 'CHESS-RCS',
  cycling: 'CYCL-RCS',
  gymnastics: 'GYM-RCS',
  boxing: 'BOX-RCS',
}

function branchCode(slug: string): string {
  return BRANCH_CODES[slug] ?? `${slug.slice(0, 5).toUpperCase()}-RCS`
}

function computeAge(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null
  const bd = new Date(birthDate)
  if (Number.isNaN(bd.getTime()) || bd > new Date()) return null
  const now = new Date()
  let age = now.getFullYear() - bd.getFullYear()
  const m = now.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--
  return age
}

interface TrackRequest {
  id: string
  fullName: string
  status: string
  createdAt: string
  branch: { name: string; color: string }
}

function StatusBadge({ status }: { status: string }) {
  const t = useT()
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: t('track.statusPending'), cls: 'bg-yellow-400/15 text-yellow-300 light:text-yellow-700 border border-yellow-400/40' },
    accepted: { label: t('track.statusAccepted'), cls: 'bg-green-500/15 text-green-300 light:text-green-700 border border-green-400/40' },
    rejected: { label: t('track.statusRejected'), cls: 'bg-red-500/15 text-red-300 light:text-red-700 border border-red-400/40' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-paper/10 text-paper/80 border border-paper/25' }
  return (
    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  )
}

function TrackCard() {
  const t = useT()
  const [phone, setPhone] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState<TrackRequest[]>([])
  const [error, setError] = useState('')
  const [formFor, setFormFor] = useState<EnrollmentFormData | null>(null)
  const [formLoadingId, setFormLoadingId] = useState('')

  /** جلب بيانات الطلب المكتملة (بنفس التحقق: الهاتف + اللقب) لإنشاء الاستمارة */
  const openForm = async (r: TrackRequest) => {
    setFormLoadingId(r.id)
    try {
      const res = await fetch('/api/public/enroll-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, phone: phone.trim(), lastName: lastName.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'تعذر جلب الاستمارة')
      setFormFor(
        enrollmentFromItem(
          d.enrollment,
          { name: d.branch.name, slug: d.branch.slug },
          d.regNumber,
          d.regYear,
          d.season
        )
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setFormLoadingId('')
    }
  }

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !lastName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/public/enroll-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), lastName: lastName.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || t('track.error'))
      setResults(d.requests ?? [])
      setSearched(true)
    } catch (err) {
      setError((err as Error).message)
      setSearched(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: 0.15 }}
      className="mt-5 rounded-3xl bg-paper/8 border border-paper/15 backdrop-blur p-5 md:p-6"
    >
      <h3 className="font-black text-paper flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-(--accent-deep, var(--silver))" />
        {t('track.title')}
      </h3>
      <p className="text-xs text-paper/60 mt-1">{t('track.desc')}</p>

      <form onSubmit={search} className="mt-3 space-y-2">
        <div className="flex gap-2">
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('track.lastName')}
            aria-label={t('track.lastName')}
            className="bg-white/95 text-(--club-dark) placeholder:text-(--club)/60 border-(--club)/20 text-right"
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xxxxxxxx"
            dir="ltr"
            inputMode="tel"
            aria-label={t('track.title')}
            className="bg-white/95 text-(--club-dark) placeholder:text-(--club)/60 border-(--club)/20 text-right"
          />
          <Button
            type="submit"
            disabled={loading || !phone.trim() || !lastName.trim()}
            className="bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) font-black rounded-xl shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="ml-1 h-4 w-4" />}
            {loading ? t('track.searching') : t('track.search')}
          </Button>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-xs font-bold text-red-300 light:text-red-700 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {searched && !error && (
        <div className="mt-3 space-y-2 max-h-56 overflow-y-auto nice-scroll">
          {results.length === 0 ? (
            <p className="text-xs text-paper/70 bg-paper/8 rounded-lg px-3 py-2.5 text-center">
              {t('track.none')}
            </p>
          ) : (
            results.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2.5 rounded-xl bg-paper/10 border border-paper/15 px-3 py-2.5"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: r.branch?.color || 'var(--silver)' }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-paper truncate">{r.fullName}</div>
                  <div className="text-[11px] font-bold" style={{ color: r.branch?.color || 'var(--silver)' }}>
                    {r.branch?.name}
                  </div>
                </div>
                <StatusBadge status={r.status} />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={formLoadingId === r.id}
                  onClick={() => openForm(r)}
                  title="إعادة إنشاء استمارة الانخراط الرسمية لهذا الطلب"
                  className="shrink-0 h-8 px-2.5 font-bold border-paper/25 text-paper hover:bg-paper/10"
                >
                  {formLoadingId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  استمارة
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>

      {/* استمارة الانخراط الرسمية — إعادة الإنشاء لطلب سابق بنفس تحقق الهاتف + اللقب */}
      <EnrollmentFormDialog
        open={!!formFor}
        onClose={() => setFormFor(null)}
        initial={formFor}
      />
    </>
  )
}

export function JoinSection({
  branches,
  preselectedBranchId,
  formRef,
}: {
  branches: BranchSummary[]
  preselectedBranchId?: string
  formRef?: React.RefObject<HTMLDivElement | null>
}) {
  const t = useT()
  const lang = useLang((s) => s.lang)
  const { toast } = useToast()
  const siteSettings = useSiteSettings((s) => s.settings)
  const season = siteSettings?.design?.season?.trim() || '2026/2027'

  // إعدادات نافذة الانخراط من الإدارة العامة (مع القيم الافتراضية)
  const enrollCfg = siteSettings?.enrollment ?? {}
  const adultAge = typeof enrollCfg.adultAge === 'number' && enrollCfg.adultAge > 0 ? enrollCfg.adultAge : 18
  const showGender = enrollCfg.showGender !== false
  const showNote = enrollCfg.showNote !== false
  const requirePhone = enrollCfg.requirePhone !== false
  const requireAddress = enrollCfg.requireAddress !== false
  const guardianTitle = enrollCfg.guardianTitle?.trim() || t('join.guardianSection')
  const adultTitle = enrollCfg.adultTitle?.trim() || t('join.adultSection')
  const formNotice = enrollCfg.notice?.[lang]?.trim() || enrollCfg.notice?.ar?.trim() || ''

  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [doneBranch, setDoneBranch] = useState('')
  const [doneAuth, setDoneAuth] = useState<Partial<AuthorizationData> | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [branchId, setBranchId] = useState(preselectedBranchId ?? '')
  const [note, setNote] = useState('')
  const [clientError, setClientError] = useState('')
  // استمارة الانخراط الرسمية — تظهر جاهزة فور نجاح التسجيل
  const [doneForm, setDoneForm] = useState<EnrollmentFormData | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const age = useMemo(() => computeAge(birthDate), [birthDate])
  const isMinor = age !== null && age < adultAge
  // صيغة التاريخ الموحدة في كامل الموقع: يوم/شهر/سنة
  const birthDisplay = formatDateDMY(birthDate)
  const benefits = [t('join.benefit1'), t('join.benefit2'), t('join.benefit3'), t('join.benefit4')]
  const selectedBranch = branches.find((b) => b.id === branchId)

  const reset = () => {
    setFirstName('')
    setLastName('')
    setGender('')
    setBirthDate('')
    setBirthPlace('')
    setGuardianName('')
    setAddress('')
    setPhone('')
    setNote('')
    setClientError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError('')
    if (!branchId) {
      toast({ title: t('join.pickBranch'), variant: 'destructive' })
      return
    }
    if (!gender && showGender) {
      setClientError(t('join.gender'))
      return
    }
    if (age === null) {
      setClientError(t('join.birthDate'))
      return
    }
    if (isMinor && guardianName.trim().length < 3) {
      setClientError(t('join.parentRequired'))
      return
    }
    if (requireAddress && !address.trim()) {
      setClientError(t('join.addressRequired'))
      return
    }
    if (requirePhone && !phone.trim()) {
      setClientError(t('join.phoneRequired'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/public/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          gender: showGender ? gender : 'male',
          birthDate,
          birthPlace,
          address,
          phone,
          parentName: isMinor ? guardianName : '',
          branchId,
          note,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'خطأ غير متوقع')
      toast({ title: 'تم الإرسال بنجاح', description: d.message })
      setDoneBranch(selectedBranch?.name ?? '')
      // استمارة الانخراط الرسمية جاهزة فوراً بمعلومات المنخرط ورقمه التسلسلي
      setDoneForm(
        enrollmentFromItem(
          {
            id: d.id,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            gender: showGender ? gender : 'male',
            birthDate,
            birthPlace,
            address,
            phone,
            parentName: isMinor ? guardianName : '',
            createdAt: new Date().toISOString(),
          },
          { name: selectedBranch?.name ?? '', slug: selectedBranch?.slug },
          d.regNumber ?? '001',
          d.regYear ?? String(new Date().getFullYear()),
          season
        )
      )
      // استخراج الاستمارة مباشرة بعد التسجيل — تُفتح نافذة المعاينة والطباعة تلقائياً
      setFormOpen(true)
      // تصريح أبوي جاهز بمعلومات الولي والابن للقاصرين (تُطبع الحقول الناقصة بخطوط منقطة)
      setDoneAuth(
        isMinor
          ? {
              guardianName: guardianName,
              address: address,
              childName: `${firstName} ${lastName}`.trim(),
              childBirth: birthDisplay,
              sport: selectedBranch?.name ?? '',
              childGender: gender === 'female' ? 'female' : 'male',
            }
          : null
      )
      setDone(true)
      reset()
    } catch (err) {
      toast({ title: 'تعذر إرسال الطلب', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="join" className="py-16 md:py-24 club-gradient relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern opacity-50" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-start">
        {/* النص التعريفي */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeaderLight />

          {/* شارة الموسم */}
          <div className="mt-6 inline-flex items-center gap-2.5 rounded-2xl bg-(--flag-red) text-white px-5 py-2.5 shadow-lg shadow-black/20 font-black">
            <CalendarRange className="h-5 w-5" />
            {t('join.seasonLabel')} {season}
          </div>

          <ul className="mt-6 space-y-4">
            {benefits.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-paper/90 font-bold"
              >
                <BadgeCheck className="h-6 w-6 text-(--accent-deep, var(--silver)) shrink-0" />
                {b}
              </motion.li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl bg-paper/8 border border-paper/15 p-5 max-w-md">
            <div className="flex items-center gap-2.5 font-black text-paper">
              <span className="h-9 w-9 rounded-xl bg-(--flag-red) text-white flex items-center justify-center shrink-0">
                <Send className="h-4 w-4" />
              </span>
              {t('join.selectedBranch')}
            </div>
            <p className="text-sm text-paper/75 mt-2 font-bold" dir="auto">
              {selectedBranch ? selectedBranch.name : t('join.branchGridHint')}
            </p>
          </div>
        </motion.div>

        {/* النموذج + تتبع الطلب */}
        <div>
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="paper-card rounded-3xl bg-white p-6 md:p-8 shadow-2xl shadow-black/30 light:shadow-black/10"
          >
            {done ? (
              <div className="text-center py-10">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-(--club-dark) mb-2">{t('join.doneTitle')}</h3>
                {doneBranch && (
                  <p className="text-sm font-black text-(--club) mb-2">
                    {t('join.sentTo')} — {doneBranch}
                  </p>
                )}
                <p className="text-muted-foreground leading-relaxed mb-6">{t('join.doneBody')}</p>

                {/* استمارة الانخراط الرسمية — جاهزة فوراً لكل منخرط */}
                {doneForm && (
                  <div className="mb-5 rounded-2xl border-2 border-(--club)/30 bg-(--club-light) p-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2 font-black text-(--club-dark) text-sm">
                      <FileDown className="h-4 w-4 text-(--club)" />
                      استمارة الانخراط الرسمية جاهزة
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      صفحة A4 واحدة: معلوماتك، الشهادة الطبية، التصريح الأبوي (للأقل من سن الرشد)،
                      الرسوم إن وجدت، والقوانين — اطبعها أو احفظها PDF ووقّعها.
                    </p>
                    <Button
                      onClick={() => setFormOpen(true)}
                      className="mt-3 w-full bg-(--club) hover:bg-(--club)/90 text-white font-bold"
                    >
                      <FileDown className="h-4 w-4 ml-1" /> عرض الاستمارة وتحميلها
                    </Button>
                  </div>
                )}

                {doneAuth && (
                  <div className="mb-6 rounded-2xl border border-(--club)/25 bg-(--club-light) p-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2 font-black text-(--club-dark) text-sm">
                      <FileSignature className="h-4 w-4 text-(--club)" />
                      تصريح أبوي جاهز للطباعة
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      ورقة رسمية بترويسة النادي معبأة بمعلوماتك — أكمل الحقول الناقصة واطبعها ووقّعها.
                    </p>
                    <Button
                      onClick={() => setAuthOpen(true)}
                      className="mt-3 w-full bg-(--club) hover:bg-(--club)/90 text-white font-bold"
                    >
                      <Printer className="h-4 w-4 ml-1" /> فتح تصريح أبوي وطباعته
                    </Button>
                  </div>
                )}
                <Button onClick={() => { setDone(false); setDoneAuth(null) }} variant="outline" className="font-bold">
                  {t('join.again')}
                </Button>
              </div>
            ) : (
              <>
                {/* ترويسة الاستمارة */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-(--club-dark) leading-snug flex items-center gap-2">
                      <UserPlus className="h-6 w-6 text-(--flag-red) shrink-0" />
                      {t('join.formTitle')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5">{t('join.formDesc')}</p>
                  </div>
                  <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-(--flag-red)/10 border border-(--flag-red)/25 text-(--flag-red) px-3 py-1.5 text-xs font-black whitespace-nowrap">
                    <CalendarRange className="h-3.5 w-3.5" />
                    {season}
                  </span>
                </div>

                {/* إشعار الاستمارة من الإعدادات */}
                {formNotice && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-(--club)/20 bg-(--club-light) px-4 py-3">
                    <Info className="h-5 w-5 text-(--club) shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm font-bold text-(--club-dark) leading-relaxed">{formNotice}</p>
                  </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                  {/* اختيار الفرع — بطاقات */}
                  <div>
                    <Label className="text-sm font-black">{t('join.branchGrid')} *</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">{t('join.branchGridHint')}</p>
                    <div
                      role="radiogroup"
                      aria-label={t('join.branchGrid')}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto nice-scroll p-1 rounded-xl bg-(--club-light)/60 border border-(--border)"
                    >
                      {branches.map((b) => {
                        const active = branchId === b.id
                        return (
                          <button
                            key={b.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setBranchId(b.id)}
                            className={`relative rounded-xl border-2 p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                              active
                                ? 'shadow-md scale-[1.02] bg-white'
                                : 'border-(--border) bg-white/80 hover:border-(--club)/40'
                            }`}
                            style={active ? { borderColor: b.color } : undefined}
                          >
                            {active && (
                              <span
                                className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full flex items-center justify-center text-white shadow-md"
                                style={{ backgroundColor: b.color }}
                              >
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                            <span
                              className="mx-auto mb-1.5 h-9 w-9 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: b.color }}
                            >
                              <BranchIcon name={b.icon} className="h-5 w-5" />
                            </span>
                            <span className="block text-[11px] font-black text-(--club-dark) leading-tight line-clamp-2 min-h-7">
                              {b.name}
                            </span>
                            <span className="block text-[9px] font-bold tracking-wider text-muted-foreground mt-0.5" dir="ltr">
                              {branchCode(b.slug)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ====== معلومات المنخرط ====== */}
                  <fieldset className="rounded-2xl border-2 border-(--border) bg-white p-4 space-y-3">
                    <legend className="px-2 -mx-1 text-sm font-black text-(--club-dark) flex items-center gap-1.5">
                      <User className="h-4 w-4 text-(--club)" />
                      {t('join.enrolleeSection')}
                    </legend>

                    {/* الاسم واللقب */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="join-first">{t('join.firstName')}</Label>
                        <Input
                          id="join-first"
                          required
                          minLength={2}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder={t('join.firstNamePlaceholder')}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="join-last">{t('join.lastName')}</Label>
                        <Input
                          id="join-last"
                          required
                          minLength={2}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder={t('join.lastNamePlaceholder')}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* الجنس + تاريخ الميلاد */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {showGender && (
                        <div>
                          <Label>{t('join.gender')}</Label>
                          <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('join.gender')}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={gender === 'male'}
                              onClick={() => setGender('male')}
                              className={`h-10 rounded-xl border-2 font-black text-sm flex items-center justify-center gap-1.5 transition-all ${
                                gender === 'male'
                                  ? 'border-(--club) bg-(--club) text-white shadow-md'
                                  : 'border-(--border) bg-white text-(--club-dark) hover:border-(--club)/40'
                              }`}
                            >
                              <User className="h-4 w-4" />
                              {t('join.male')}
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={gender === 'female'}
                              onClick={() => setGender('female')}
                              className={`h-10 rounded-xl border-2 font-black text-sm flex items-center justify-center gap-1.5 transition-all ${
                                gender === 'female'
                                  ? 'border-(--club) bg-(--club) text-white shadow-md'
                                  : 'border-(--border) bg-white text-(--club-dark) hover:border-(--club)/40'
                              }`}
                            >
                              <Users className="h-4 w-4" />
                              {t('join.female')}
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="join-birth">{t('join.birthDate')}</Label>
                        <div className="relative mt-1.5">
                          <Cake className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="join-birth"
                            required
                            type="date"
                            value={birthDate}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="pr-9 text-right"
                            dir="ltr"
                          />
                        </div>
                        {birthDisplay ? (
                          <span className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-black text-(--club) bg-(--club-light) rounded-full px-2.5 py-0.5" dir="ltr">
                            <Cake className="h-3 w-3" />
                            {birthDisplay}
                          </span>
                        ) : (
                          <span className="inline-flex items-center mt-1.5 text-[10px] font-bold text-muted-foreground">
                            {t('join.birthDateHint')}
                          </span>
                        )}
                        {age !== null && (
                          <span className="inline-flex items-center gap-1 mt-1.5 mr-2 text-[11px] font-black text-(--club) bg-(--club-light) rounded-full px-2.5 py-0.5">
                            {t('join.computedAge')}: {age} {t('join.years')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* مكان الميلاد (اختياري — يظهر في الاستمارة الرسمية) */}
                    {enrollCfg.form?.showBirthPlace !== false && (
                      <div>
                        <Label htmlFor="join-birth-place">مكان الميلاد (اختياري)</Label>
                        <Input
                          id="join-birth-place"
                          value={birthPlace}
                          onChange={(e) => setBirthPlace(e.target.value)}
                          placeholder="مثال: سعيدة"
                          className="mt-1.5"
                          maxLength={120}
                        />
                      </div>
                    )}
                  </fieldset>

                  {/* ====== القسم الشرطي حسب العمر ====== */}
                  {age === null ? (
                    <div className="rounded-2xl border-2 border-dashed border-(--border) bg-muted/40 px-4 py-3.5 flex items-center gap-2.5">
                      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-xs font-bold text-muted-foreground">{t('join.dynamicHint')}</p>
                    </div>
                  ) : isMinor ? (
                    /* ---- معلومات ولي الأمر (للأقل من سن الرشد) ---- */
                    <motion.fieldset
                      key="guardian"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl border-2 border-amber-400/60 bg-amber-50/70 p-4 space-y-3"
                    >
                      <legend className="px-2 -mx-1 text-sm font-black text-amber-800 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        {guardianTitle}
                      </legend>

                      <div className="flex items-center gap-2 rounded-xl bg-amber-100/80 border border-amber-300 px-3 py-2">
                        <Users className="h-4 w-4 text-amber-700 shrink-0" />
                        <p className="text-[11px] font-black text-amber-800">{t('join.guardianNotice')}</p>
                      </div>

                      {/* الاسم الكامل لولي الأمر */}
                      <div>
                        <Label htmlFor="join-guardian-name">{t('join.guardianName')}</Label>
                        <Input
                          id="join-guardian-name"
                          required
                          minLength={3}
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder={t('join.guardianNamePlaceholder')}
                          className="mt-1.5"
                        />
                      </div>

                      {/* العنوان */}
                      <div>
                        <Label htmlFor="join-guardian-address">{t('join.address')}</Label>
                        <div className="relative mt-1.5">
                          <Home className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Textarea
                            id="join-guardian-address"
                            required={requireAddress}
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={t('join.addressPlaceholder')}
                            className="pr-9"
                          />
                        </div>
                      </div>

                      {/* رقم هاتف ولي الأمر */}
                      <div>
                        <Label htmlFor="join-guardian-phone">{t('join.phone')}</Label>
                        <div className="relative mt-1.5">
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="join-guardian-phone"
                            required={requirePhone}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="05xxxxxxxx"
                            dir="ltr"
                            inputMode="tel"
                            className="pr-9 text-right"
                          />
                        </div>
                      </div>
                    </motion.fieldset>
                  ) : (
                    /* ---- معلومات المنخرط الشخصية (سن الرشد فما فوق) ---- */
                    <motion.fieldset
                      key="adult"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl border-2 border-green-500/40 bg-green-50/60 p-4 space-y-3"
                    >
                      <legend className="px-2 -mx-1 text-sm font-black text-green-800 flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        {adultTitle}
                      </legend>

                      <div className="flex items-center gap-2 rounded-xl bg-green-100/70 border border-green-300 px-3 py-2">
                        <BadgeCheck className="h-4 w-4 text-green-700 shrink-0" />
                        <p className="text-[11px] font-black text-green-800">{t('join.adultNotice')}</p>
                      </div>

                      {/* العنوان الشخصي */}
                      <div>
                        <Label htmlFor="join-adult-address">{t('join.address')}</Label>
                        <div className="relative mt-1.5">
                          <Home className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Textarea
                            id="join-adult-address"
                            required={requireAddress}
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={t('join.addressPlaceholder')}
                            className="pr-9"
                          />
                        </div>
                      </div>

                      {/* رقم الهاتف الشخصي */}
                      <div>
                        <Label htmlFor="join-adult-phone">{t('join.phone')}</Label>
                        <div className="relative mt-1.5">
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="join-adult-phone"
                            required={requirePhone}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="05xxxxxxxx"
                            dir="ltr"
                            inputMode="tel"
                            className="pr-9 text-right"
                          />
                        </div>
                      </div>
                    </motion.fieldset>
                  )}

                  {/* ملاحظات */}
                  {showNote && (
                    <div>
                      <Label htmlFor="join-note">{t('join.note')}</Label>
                      <Textarea
                        id="join-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('join.notePlaceholder')}
                        rows={2}
                        className="mt-1.5"
                      />
                    </div>
                  )}

                  {clientError && (
                    <p className="text-xs font-bold text-red-600 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
                      {clientError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full h-13 text-base font-black rounded-xl text-white bg-gradient-to-l from-(--flag-red) to-(--flag-red)/80 hover:from-(--flag-red)/90 hover:to-(--flag-red)/70 shadow-lg shadow-(--flag-red)/25 transition-all"
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="ml-2 h-5 w-5" />
                    )}
                    {saving ? t('join.sending') : t('join.submit')}
                  </Button>
                </form>
              </>
            )}
          </motion.div>

          {/* بطاقة تتبع الطلب */}
          <TrackCard />
        </div>
      </div>
          {/* نافذة تصريح أبوي للقاصرين — تُفتح من شاشة النجاح */}
      <ParentAuthorizationDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initial={doneAuth ?? {}}
        canArchive={false}
        publicMode
      />

      {/* استمارة الانخراط الرسمية — فور نجاح التسجيل */}
      <EnrollmentFormDialog
        open={formOpen && !!doneForm}
        onClose={() => setFormOpen(false)}
        initial={doneForm}
      />
    </section>
  )
}

function SectionHeaderLight() {
  const t = useT()
  // عناوين القسم من إعدادات الإدارة (إنضم إلى عائلة النادي) مع قيم افتراضية
  const ov = useSectionTexts('join')
  return (
    <div>
      <span className="inline-flex items-center gap-2 text-sm font-bold tracking-wide px-4 py-1.5 rounded-full bg-paper/10 text-(--accent-deep, var(--silver))">
        <span className="h-1.5 w-1.5 rounded-full bg-(--accent-deep, var(--silver))" />
        {ov.eyebrow ?? t('join.eyebrow')}
        <span className="h-1.5 w-1.5 rounded-full bg-(--accent-deep, var(--silver))" />
      </span>
      <h2 className="mt-4 text-3xl md:text-4xl font-black text-paper leading-snug">
        {ov.title ?? t('join.title1')}{' '}
        <span className="silver-text">{ov.titleGold ?? t('join.titleGold')}</span>
      </h2>
      <p className="mt-3 text-paper/75 leading-relaxed">{ov.subtitle ?? t('join.subtitle')}</p>
    </div>
  )
}
