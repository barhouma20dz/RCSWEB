'use client'

/**
 * إطارات وأعضاء الفروع — إدارة مركزية لكل منصبي النادي على مستوى الفروع
 * الاسم، اللقب، تاريخ الميلاد، المنصب الهرمي، التخصص — وملفات كل إطار من كتب النادي
 */

import { useMemo, useState } from 'react'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  CalendarDays,
  Phone,
  BadgeCheck,
  FileText,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { formatDateDMY } from '@/lib/date-format'
import type { AdminData, BranchMemberItem } from '../types'

/** المناصب الرسمية بالترتيب الهرمي */
export const POSITION_ORDER = [
  'رئيس الفرع',
  'نائب رئيس الفرع',
  'الأمين العام للفرع',
  'المدير التقني للفرع',
  'نائب المدير التقني',
  'مدرب',
  'عضو مكتب الفرع',
  'عضو',
]

const EMPTY_FORM = {
  branchId: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  position: 'عضو',
  specialty: '',
  phone: '',
  appointedAt: '',
  notes: '',
}

export function MembersManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BranchMemberItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [profile, setProfile] = useState<BranchMemberItem | null>(null)

  const members = data.members ?? []
  const branches = data.branches ?? []
  const documents = data.documents ?? []

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (branchFilter !== 'all' && m.branchId !== branchFilter) return false
      if (positionFilter !== 'all' && m.position !== positionFilter) return false
      if (query) {
        const q = query.trim()
        if (!m.firstName.includes(q) && !m.lastName.includes(q) && !m.specialty.includes(q)) return false
      }
      return true
    })
  }, [members, branchFilter, positionFilter, query])

  const memberDocs = useMemo(
    () => (profile ? documents.filter((d) => d.memberId === profile.id) : []),
    [documents, profile]
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, branchId: branchFilter !== 'all' ? branchFilter : '' })
    setOpen(true)
  }

  const openEdit = (m: BranchMemberItem) => {
    setEditing(m)
    setForm({
      branchId: m.branchId,
      firstName: m.firstName,
      lastName: m.lastName,
      birthDate: m.birthDate,
      position: m.position,
      specialty: m.specialty,
      phone: m.phone,
      appointedAt: m.appointedAt,
      notes: m.notes,
    })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editing ? 'update' : 'create',
          id: editing?.id,
          data: form,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحفظ')
      toast({ title: editing ? 'تم تحديث بيانات الإطار' : 'تمت إضافة الإطار إلى الفرع' })
      setOpen(false)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (m: BranchMemberItem) => {
    if (!window.confirm(`حذف الإطار «${m.firstName} ${m.lastName}» من فرع ${m.branch?.name}؟`)) return
    try {
      const res = await apiFetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: m.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحذف')
      toast({ title: 'تم حذف الإطار' })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحذف', variant: 'destructive' })
    }
  }

  const positionBadge = (position: string) => {
    if (position === 'رئيس الفرع') return 'bg-(--club) text-white'
    if (position === 'نائب رئيس الفرع') return 'bg-(--club)/15 text-(--club)'
    if (position.startsWith('المدير التقني')) return 'bg-(--flag-red)/10 text-(--flag-red)'
    if (position.startsWith('الأمين العام')) return 'bg-(--flag-green)/10 text-(--flag-green)'
    return 'bg-muted text-(--club-dark)'
  }

  const initials = (m: BranchMemberItem) => `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`

  return (
    <div>
      {/* رأس القسم */}
      <div className="rounded-3xl club-gradient p-5 md:p-6 mb-5 relative overflow-hidden">
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-(--silver)/10" />
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-(--silver)" />
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">إطارات وأعضاء الفروع</h2>
            <p className="text-white/70 text-sm mt-1 max-w-2xl leading-relaxed">
              كل الإطارات المعيّنين على مستوى فروع النادي: الاسم واللقب وتاريخ الميلاد والمنصب — مرتبين هرمياً،
              ومع ملفات كل إطار من كتب النادي.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-(--silver) text-(--club-dark)">{members.length} إطار</Badge>
          <Badge variant="outline" className="border-white/30 text-white/85">
            {branches.length} فرعاً
          </Badge>
          <Badge variant="outline" className="border-white/30 text-white/85">
            {new Set(members.map((m) => m.branchId)).size} مكتب مكوَّن
          </Badge>
        </div>
      </div>

      {/* أدوات الفلترة */}
      <div className="rounded-2xl bg-white border border-(--border) p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو اللقب أو التخصص..."
            className="pr-9"
          />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="كل الفروع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفروع</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="كل المناصب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المناصب</SelectItem>
            {POSITION_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold shrink-0">
          <Plus className="ml-1 h-4 w-4" />
          إطار جديد
        </Button>
      </div>

      {/* شبكة البطاقات */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-(--border) p-10 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          لا يوجد إطارات مطابقون للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 max-h-[620px] overflow-y-auto nice-scroll p-0.5">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl bg-white border border-(--border) p-4 card-hover cursor-pointer"
              onClick={() => setProfile(m)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
                  style={{ backgroundColor: m.branch?.color ?? 'var(--club)' }}
                >
                  {initials(m)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-(--club-dark) text-sm leading-snug">
                    {m.firstName} {m.lastName}
                  </div>
                  <Badge className={`text-[10px] mt-1 ${positionBadge(m.position)}`}>
                    <BadgeCheck className="h-3 w-3 ml-1" />
                    {m.position}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {m.specialty && (
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" /> {m.specialty}
                  </div>
                )}
                {m.birthDate && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> مولود في {formatDateDMY(m.birthDate)}
                  </div>
                )}
                {m.phone && (
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <Phone className="h-3.5 w-3.5" /> <span>{m.phone}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-(--border) flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-(--club)">
                  <FileText className="h-3.5 w-3.5" />
                  {m.documentsCount ?? 0} ملف في كتب النادي
                </span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(m)} title="تعديل">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => remove(m)}
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة الإنشاء/التعديل */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل بيانات الإطار' : 'تعيين إطار جديد في فرع'}</DialogTitle>
            <DialogDescription>
              البيانات الكاملة للإطار: الاسم واللقب وتاريخ الميلاد والمنصب في الفرع — الترتيب الهرمي يُطبَّق تلقائياً.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>الفرع *</Label>
              <Select value={form.branchId || '__none'} onValueChange={(v) => setForm({ ...form, branchId: v === '__none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" disabled>
                    اختر الفرع
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>المنصب في الفرع *</Label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الاسم *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="مثال: كمال" />
            </div>
            <div className="space-y-1.5">
              <Label>اللقب *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="مثال: بوعلام" />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ الميلاد</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ التعيين</Label>
              <Input type="date" value={form.appointedAt} onChange={(e) => setForm({ ...form, appointedAt: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>التخصص</Label>
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="مثال: أستاذ تعليم بدني" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0770000000" dir="ltr" className="text-left" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="اختياري..." />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border)">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Users className="h-4 w-4 ml-1" />}
              {editing ? 'حفظ التعديلات' : 'تعيين الإطار'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة ملف الإطار الشخصي */}
      <Dialog open={!!profile} onOpenChange={(v) => !v && setProfile(null)}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader>
            <DialogTitle>الملف الشخصي للإطار</DialogTitle>
            <DialogDescription>
              {profile?.firstName} {profile?.lastName} — {profile?.position}
              {profile?.branch ? ` في فرع ${profile.branch.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          {profile && (
            <div>
              <div className="rounded-2xl bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الميلاد</span>
                  <span className="font-bold">{formatDateDMY(profile.birthDate) || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ التعيين</span>
                  <span className="font-bold">{formatDateDMY(profile.appointedAt) || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التخصص</span>
                  <span className="font-bold">{profile.specialty || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الهاتف</span>
                  <span className="font-bold" dir="ltr">{profile.phone || '—'}</span>
                </div>
                {profile.notes && (
                  <div className="pt-2 border-t border-(--border)">
                    <span className="text-muted-foreground">ملاحظات: </span>
                    <span>{profile.notes}</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="font-black text-sm text-(--club-dark) mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> ملفاته في كتب النادي ({memberDocs.length})
                </div>
                {memberDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                    لا توجد وثائق مرتبطة بهذا الإطار بعد — سجّل وثيقة من كتب النادي واربطها به.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-52 overflow-y-auto nice-scroll">
                    {memberDocs.map((d) => (
                      <li key={d.id} className="rounded-xl border border-(--border) p-3 flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-(--club) shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{d.title}</div>
                          <div className="text-[10px] text-muted-foreground" dir="ltr">
                            {d.refNumber}
                          </div>
                        </div>
                        {d.visibleToBranch && (
                          <Badge className="bg-(--flag-green)/15 text-(--flag-green) text-[10px]">في الفرع</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
