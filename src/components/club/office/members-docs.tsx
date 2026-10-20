'use client'

/**
 * صفحات الفرع: أعضاء الفرع (الاسم، اللقب، تاريخ الميلاد، المنصب)
 * — إضافة وتعديل وحذف كاملة من حساب الفرع (مثال: تغيير أو خطأ)
 * وكتب الإدارة الواردة (الملفات والمراسلات الموزَّعة على الفرع بأمر الإدارة)
 */

import { useMemo, useState } from 'react'
import {
  Users,
  BadgeCheck,
  CalendarDays,
  Phone,
  Award,
  BookOpen,
  FileText,
  Search,
  Printer,
  Stamp,
  ScrollText,
  Mail,
  Inbox,
  Palette,
  Eye,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { formatDateDMY } from '@/lib/date-format'
import { DocumentPaper, DOC_TYPE_LABELS } from '../document-paper'
import type { BranchMemberItem, ClubDocumentItem, OfficeData } from '../types'

/** المناصب الهرمية الرسمية — نفس ترتيب الإدارة العامة */
const POSITIONS = [
  'رئيس الفرع',
  'نائب رئيس الفرع',
  'الأمين العام للفرع',
  'المدير التقني للفرع',
  'نائب المدير التقني',
  'مدرب',
  'عضو مكتب الفرع',
  'عضو',
]

type MemberForm = {
  firstName: string
  lastName: string
  birthDate: string
  position: string
  specialty: string
  phone: string
  appointedAt: string
  notes: string
}

const emptyMember: MemberForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  position: 'عضو',
  specialty: '',
  phone: '',
  appointedAt: '',
  notes: '',
}

async function officeItem(
  action: 'create' | 'update' | 'delete',
  payload: { id?: string; data?: object }
): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch('/api/office/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, type: 'member', ...payload }),
  })
  const d = await res.json()
  return { ok: res.ok, error: d.error }
}

/* ==================== أعضاء الفرع — إدارة كاملة ==================== */

export function BranchMembersManager({ data, reload }: { data: OfficeData; reload: () => void }) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<BranchMemberItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<BranchMemberItem | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyMember)
  const members = data.members ?? []

  const positions = useMemo(() => {
    const set = new Set(members.map((m) => m.position))
    POSITIONS.forEach((p) => set.add(p))
    return Array.from(set)
  }, [members])

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (positionFilter !== 'all' && m.position !== positionFilter) return false
      if (query) {
        const q = query.trim()
        if (!m.firstName.includes(q) && !m.lastName.includes(q) && !m.specialty.includes(q)) return false
      }
      return true
    })
  }, [members, positionFilter, query])

  const startCreate = () => {
    setEdit(null)
    setForm(emptyMember)
    setOpen(true)
  }

  const startEdit = (m: BranchMemberItem) => {
    setEdit(m)
    setForm({
      firstName: m.firstName,
      lastName: m.lastName,
      birthDate: m.birthDate ?? '',
      position: m.position,
      specialty: m.specialty ?? '',
      phone: m.phone ?? '',
      appointedAt: m.appointedAt ?? '',
      notes: m.notes ?? '',
    })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    const r = await officeItem(edit ? 'update' : 'create', { id: edit?.id, data: form })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث بيانات العضو ✅' : 'تمت إضافة العضو ✅' })
    setOpen(false)
    reload()
  }

  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف العضو' })
    setDel(null)
    reload()
  }

  const positionBadge = (position: string) => {
    if (position === 'رئيس الفرع') return 'bg-(--club) text-white'
    if (position === 'نائب رئيس الفرع') return 'bg-(--club)/15 text-(--club)'
    if (position.startsWith('المدير التقني')) return 'bg-(--flag-red)/10 text-(--flag-red)'
    if (position.startsWith('الأمين العام')) return 'bg-(--flag-green)/10 text-(--flag-green)'
    return 'bg-muted text-(--club-dark)'
  }

  return (
    <div>
      <div className="rounded-2xl bg-white border border-(--border) p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: data.branch.color }}
          >
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-40">
            <h3 className="font-black text-(--club-dark)">أعضاء وإطارات فرع {data.branch.name}</h3>
            <p className="text-xs text-muted-foreground">
              {members.length} عضواً — مرتبون حسب المنصب، يمكنك الإضافة والتعديل والحذف بحرية
            </p>
          </div>
          <Button
            onClick={startCreate}
            className="bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) font-black shrink-0"
          >
            <UserPlus className="ml-1.5 h-4 w-4" />
            إضافة عضو
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو اللقب أو التخصص..."
              className="pr-9"
            />
          </div>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="كل المناصب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المناصب</SelectItem>
              {positions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-(--border) p-10 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          لا يوجد أعضاء مطابقون — أضف عضواً جديداً من الزر أعلاه
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((m, i) => (
            <div
              key={m.id}
              className="rounded-2xl bg-white border border-(--border) p-4 card-hover relative overflow-hidden group"
            >
              {i === 0 && positionFilter === 'all' && (
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: data.branch.color }} />
              )}
              {/* أدوات التعديل والحذف */}
              <div className="absolute top-2 left-2 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-white/90"
                  onClick={() => startEdit(m)}
                  aria-label={`تعديل ${m.firstName} ${m.lastName}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-white/90 text-destructive"
                  onClick={() => setDel(m)}
                  aria-label={`حذف ${m.firstName} ${m.lastName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
                  style={{ backgroundColor: data.branch.color }}
                >
                  {m.firstName.charAt(0)}
                  {m.lastName.charAt(0)}
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
                {m.birthDate && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> تاريخ الميلاد: {formatDateDMY(m.birthDate)}
                  </div>
                )}
                {m.specialty && (
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" /> {m.specialty}
                  </div>
                )}
                {m.phone && (
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <Phone className="h-3.5 w-3.5" /> <span>{m.phone}</span>
                  </div>
                )}
                {m.appointedAt && (
                  <div className="flex items-center gap-1.5">
                    <Stamp className="h-3.5 w-3.5" /> تاريخ التعيين: {formatDateDMY(m.appointedAt)}
                  </div>
                )}
              </div>
              {m.notes && (
                <p className="mt-2 text-[11px] text-muted-foreground bg-(--club-light) rounded-lg px-3 py-1.5 line-clamp-2">
                  {m.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* حوار الإضافة / التعديل */}
      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto nice-scroll">
          <DialogHeader>
            <DialogTitle className="font-black text-(--club-dark) flex items-center gap-2">
              {edit ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {edit ? `تعديل بيانات: ${edit.firstName} ${edit.lastName}` : 'إضافة عضو جديد للفرع'}
            </DialogTitle>
            <DialogDescription>
              كل التغييرات تظهر فوراً في بطاقة العضو — ويمكن تعديلها أو حذفها لاحقاً عند الحاجة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="مثال: كمال"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>اللقب *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="مثال: بوعلام"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>المنصب في الفرع *</Label>
                <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="اختر المنصب" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  dir="ltr"
                  className="mt-1.5 text-right"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التخصص</Label>
                <Input
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="مثال: مدرب فئة الناشئين"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="mt-1.5 text-right"
                />
              </div>
            </div>
            <div>
              <Label>تاريخ التعيين</Label>
              <Input
                type="date"
                value={form.appointedAt}
                onChange={(e) => setForm({ ...form, appointedAt: e.target.value })}
                dir="ltr"
                className="mt-1.5 text-right"
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أي تفاصيل إضافية عن العضو..."
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={save}
              disabled={saving}
              className="w-full h-11 font-black bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark)"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {saving ? 'جارٍ الحفظ...' : edit ? 'حفظ التعديلات' : 'إضافة العضو'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد حذف العضو</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف العضو{' '}
              <strong>
                {del?.firstName} {del?.lastName}
              </strong>{' '}
              ({del?.position})؟ لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive hover:bg-destructive/90">
              نعم، احذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ==================== كتب الإدارة الواردة ==================== */

const DOC_ICONS: Record<ClubDocumentItem['type'], React.ComponentType<{ className?: string }>> = {
  file: FileText,
  minute: ScrollText,
  letter: Mail,
  request: Inbox,
  design: Palette,
  issued: Stamp,
}

export function BranchDocumentsManager({ data }: { data: OfficeData }) {
  const [viewDoc, setViewDoc] = useState<ClubDocumentItem | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const documents = data.documents ?? []

  const filtered = useMemo(
    () => documents.filter((d) => typeFilter === 'all' || d.type === typeFilter),
    [documents, typeFilter]
  )

  return (
    <div>
      <div className="rounded-2xl bg-white border border-(--border) p-4 mb-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-10 w-10 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-(--club)" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-(--club-dark)">كتب الإدارة الواردة</h3>
            <p className="text-xs text-muted-foreground">
              الملفات والمحاضر والمراسلات التي وزّعتها/أرسلتها الإدارة العامة إلى فرع {data.branch.name}
            </p>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="كل الأنواع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {(Object.keys(DOC_TYPE_LABELS) as ClubDocumentItem['type'][]).map((t) => (
                <SelectItem key={t} value={t}>
                  {DOC_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-(--border) p-10 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          لا توجد وثائق واردة بعد — تظهر هنا بأمر من الإدارة العامة
        </div>
      ) : (
        <ul className="rounded-2xl bg-white border border-(--border) divide-y divide-(--border) max-h-[560px] overflow-y-auto nice-scroll">
          {filtered.map((doc) => {
            const Icon = DOC_ICONS[doc.type]
            return (
              <li key={doc.id}>
                <button
                  onClick={() => setViewDoc(doc)}
                  className="w-full text-right p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="h-11 w-11 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-(--club)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-(--club-dark) text-sm">{doc.title}</span>
                      <Badge variant="outline" className="text-[10px] font-mono" dir="ltr">
                        {doc.refNumber || 'بلا رقم'}
                      </Badge>
                      <Badge className="text-[10px] bg-(--club)/10 text-(--club)">
                        {DOC_TYPE_LABELS[doc.type]}
                      </Badge>
                      {!doc.branchId && (
                        <Badge className="text-[10px] bg-(--flag-green)/10 text-(--flag-green)">
                          <Building2 className="h-3 w-3 ml-1" /> عامة لكل الفروع
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {doc.member ? `الإطار: ${doc.member.firstName} ${doc.member.lastName} — ` : ''}
                      {formatDateDMY(doc.createdAt)}
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* عرض الورقة */}
      <Dialog open={!!viewDoc} onOpenChange={(v) => !v && setViewDoc(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader className="doc-print-hide">
            <DialogTitle>وثيقة من الإدارة العامة</DialogTitle>
            <DialogDescription>{viewDoc?.title}</DialogDescription>
          </DialogHeader>
          {viewDoc && (
            <>
              <DocumentPaper doc={viewDoc} />
              <div className="flex justify-end gap-2 doc-print-hide">
                <Button variant="outline" onClick={() => setViewDoc(null)}>
                  إغلاق
                </Button>
                <Button onClick={() => window.print()} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
                  <Printer className="h-4 w-4 ml-1" /> طباعة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
