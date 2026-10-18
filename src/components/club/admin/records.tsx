'use client'

/**
 * كتب النادي — سجل مركزي للملفات والمحاضر والمراسلات والطلبات وتصاميم الأوراق
 * مع مصمم أوراق رسمي (ترويسة، ختم، توقيع، علامة مائية) ومعاينة حية وطباعة
 * وأمر الإدارة: إظهار/إرسال الوثيقة إلى حساب الفرع
 */

import { useMemo, useState } from 'react'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  FileText,
  ScrollText,
  Mail,
  Inbox,
  Palette,
  Printer,
  Eye,
  EyeOff,
  Search,
  Stamp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
import { DocumentPaper, DOC_TYPE_LABELS, parseDesign, type DocumentDesign } from '../document-paper'
import type { AdminData, ClubDocumentItem, ClubDocumentType } from '../types'

const TYPE_ICONS: Record<ClubDocumentType, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  minute: ScrollText,
  letter: Mail,
  request: Inbox,
  design: Palette,
}

const TYPE_BADGE: Record<ClubDocumentType, string> = {
  file: 'bg-(--club)/10 text-(--club)',
  minute: 'bg-(--flag-red)/10 text-(--flag-red)',
  letter: 'bg-(--flag-green)/10 text-(--flag-green)',
  request: 'bg-amber-500/10 text-amber-700',
  design: 'bg-purple-500/10 text-purple-700',
}

const CATEGORIES = ['محاضر التنصيب', 'ملفات الإطارات', 'ملفات إدارية', 'مراسلات', 'طلبات', 'تصاميم أوراق', 'قرارات']

const DEFAULT_FORM = {
  refNumber: '',
  title: '',
  type: 'file' as ClubDocumentType,
  category: '',
  content: '',
  branchId: '',
  memberId: '',
  visibleToBranch: false,
  design: '',
}

const DEFAULT_DESIGN: DocumentDesign = {
  style: 'official',
  accent: 'navy',
  showLogo: true,
  showStamp: true,
  showWatermark: true,
  signatureName: 'رئيس النادي',
}

export function RecordsManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ClubDocumentItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewDoc, setViewDoc] = useState<ClubDocumentItem | null>(null)
  const [formTab, setFormTab] = useState<'data' | 'design'>('data')
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [design, setDesign] = useState<DocumentDesign>({ ...DEFAULT_DESIGN })

  const documents = data.documents ?? []
  const members = data.members ?? []
  const branches = data.branches ?? []

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (branchFilter === 'general' && d.branchId) return false
      if (branchFilter !== 'all' && branchFilter !== 'general' && d.branchId !== branchFilter) return false
      if (query) {
        const q = query.trim()
        if (
          !d.title.includes(q) &&
          !(d.refNumber || '').toLowerCase().includes(q.toLowerCase()) &&
          !d.category.includes(q)
        )
          return false
      }
      return true
    })
  }, [documents, typeFilter, branchFilter, query])

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length }
    for (const d of documents) c[d.type] = (c[d.type] ?? 0) + 1
    return c
  }, [documents])

  const nextRef = useMemo(() => {
    const year = new Date().getFullYear()
    return `CRS/${year}/${String(documents.length + 1).padStart(3, '0')}`
  }, [documents.length])

  // الأعضاء المتاحون حسب الفرع المختار
  const availableMembers = useMemo(() => {
    if (form.branchId) return members.filter((m) => m.branchId === form.branchId)
    return members
  }, [members, form.branchId])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...DEFAULT_FORM, refNumber: nextRef })
    setDesign({ ...DEFAULT_DESIGN })
    setFormTab('data')
    setOpen(true)
  }

  const openEdit = (doc: ClubDocumentItem) => {
    setEditing(doc)
    setForm({
      refNumber: doc.refNumber,
      title: doc.title,
      type: doc.type,
      category: doc.category,
      content: doc.content,
      branchId: doc.branchId ?? '',
      memberId: doc.memberId ?? '',
      visibleToBranch: doc.visibleToBranch,
      design: doc.design,
    })
    setDesign(parseDesign(doc.design))
    setFormTab('data')
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editing ? 'update' : 'create',
          id: editing?.id,
          data: {
            refNumber: form.refNumber,
            title: form.title,
            type: form.type,
            category: form.category,
            content: form.content,
            branchId: form.branchId || null,
            memberId: form.memberId || null,
            visibleToBranch: form.visibleToBranch,
            design: JSON.stringify(design),
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحفظ')
      toast({ title: editing ? 'تم تحديث الوثيقة في كتب النادي' : 'تم تسجيل الوثيقة في كتب النادي' })
      setOpen(false)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleVisible = async (doc: ClubDocumentItem) => {
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: doc.visibleToBranch ? 'hide' : 'show',
          id: doc.id,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تنفيذ الأمر')
      toast({
        title: doc.visibleToBranch
          ? `تم إخفاء «${doc.title}» من حساب الفرع`
          : `تم ${doc.branchId ? 'إرسال' : 'عرض'} «${doc.title}» في حساب الفرع`,
      })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل التنفيذ', variant: 'destructive' })
    }
  }

  const remove = async (doc: ClubDocumentItem) => {
    if (!window.confirm(`حذف «${doc.title}» نهائياً من كتب النادي؟`)) return
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: doc.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحذف')
      toast({ title: 'تم حذف الوثيقة' })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحذف', variant: 'destructive' })
    }
  }

  return (
    <div>
      {/* رأس القسم */}
      <div className="rounded-3xl club-gradient p-5 md:p-6 mb-5 relative overflow-hidden">
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-(--silver)/10" />
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-(--silver)" />
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">كتب النادي</h2>
            <p className="text-white/70 text-sm mt-1 max-w-2xl leading-relaxed">
              السجل الرسمي لكل ملفات النادي ومحاضر التنصيب والمراسلات والطلبات — لكل إطار وملفاته الشخصية،
              مع مصمم أوراق رسمي وأمر الإدارة بالإظهار في حساب الفرع أو الإرسال إليه.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-(--silver) text-(--club-dark)">{documents.length} وثيقة</Badge>
          {(Object.keys(DOC_TYPE_LABELS) as ClubDocumentType[]).map((t) => (
            <Badge key={t} variant="outline" className="border-white/30 text-white/85">
              {DOC_TYPE_LABELS[t]}: {typeCounts[t] ?? 0}
            </Badge>
          ))}
        </div>
      </div>

      {/* أدوات الفلترة */}
      <div className="rounded-2xl bg-white border border-(--border) p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بعنوان الوثيقة أو رقم المرجع أو التصنيف..."
            className="pr-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع ({typeCounts.all})</SelectItem>
            {(Object.keys(DOC_TYPE_LABELS) as ClubDocumentType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {DOC_TYPE_LABELS[t]} ({typeCounts[t] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="كل الفروع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفروع</SelectItem>
            <SelectItem value="general">عامة لجميع الفروع</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold shrink-0">
          <Plus className="ml-1 h-4 w-4" />
          وثيقة جديدة
        </Button>
      </div>

      {/* قائمة الوثائق */}
      <div className="rounded-2xl bg-white border border-(--border) overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            لا توجد وثائق مطابقة — سجّل أول وثيقة في كتب النادي
          </div>
        ) : (
          <ul className="divide-y divide-(--border) max-h-[560px] overflow-y-auto nice-scroll">
            {filtered.map((doc) => {
              const Icon = TYPE_ICONS[doc.type]
              return (
                <li key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-muted/40 transition-colors">
                  <div className="h-11 w-11 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-(--club)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-(--club-dark) text-sm">{doc.title}</span>
                      <Badge variant="outline" className="text-[10px] font-mono" dir="ltr">
                        {doc.refNumber || 'بلا رقم'}
                      </Badge>
                      <Badge className={`text-[10px] ${TYPE_BADGE[doc.type]}`}>{DOC_TYPE_LABELS[doc.type]}</Badge>
                      {doc.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {doc.category}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>{doc.branch ? `فرع ${doc.branch.name}` : 'عامة لجميع الفروع'}</span>
                      {doc.member && (
                        <span>
                          الإطار: {doc.member.firstName} {doc.member.lastName}
                        </span>
                      )}
                      <span>{formatDateDMY(doc.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {doc.visibleToBranch ? (
                      <Badge className="bg-(--flag-green)/15 text-(--flag-green) text-[10px]">
                        <Eye className="h-3 w-3 ml-1" /> معروضة في الفرع
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        <EyeOff className="h-3 w-3 ml-1" /> مؤرشفة
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setViewDoc(doc)} title="عرض الورقة">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleVisible(doc)}
                      title={doc.visibleToBranch ? 'إخفاء من حساب الفرع' : 'إظهار/إرسال إلى حساب الفرع'}
                    >
                      {doc.visibleToBranch ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(doc)} title="تعديل">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => remove(doc)}
                      className="text-destructive hover:text-destructive"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* نافذة الإنشاء/التعديل مع المصمم */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-(--club)" />
              {editing ? 'تعديل وثيقة من كتب النادي' : 'تسجيل وثيقة جديدة في كتب النادي'}
            </DialogTitle>
            <DialogDescription>
              سجّل بيانات الوثيقة ثم صمّم ورقتها الرسمية (الترويسة، الختم، التوقيع) بمعاينة حية قبل الحفظ.
            </DialogDescription>
          </DialogHeader>

          {/* تبويبات */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setFormTab('data')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                formTab === 'data' ? 'bg-(--club) text-white shadow' : 'bg-muted text-(--club-dark) hover:bg-muted/70'
              }`}
            >
              بيانات الوثيقة
            </button>
            <button
              onClick={() => setFormTab('design')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                formTab === 'design' ? 'bg-(--club) text-white shadow' : 'bg-muted text-(--club-dark) hover:bg-muted/70'
              }`}
            >
              <Palette className="h-4 w-4" />
              تصميم الورقة
            </button>
          </div>

          {formTab === 'data' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>رقم المرجع</Label>
                <Input
                  value={form.refNumber}
                  onChange={(e) => setForm({ ...form, refNumber: e.target.value })}
                  placeholder="CRS/2025/001"
                  dir="ltr"
                  className="text-left font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع الوثيقة *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ClubDocumentType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DOC_TYPE_LABELS) as ClubDocumentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {DOC_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>عنوان الوثيقة *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: محضر تنصيب مكتب فرع كرة القدم"
                />
              </div>
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select value={form.category || '__none'} onValueChange={(v) => setForm({ ...form, category: v === '__none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">بلا تصنيف</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الفرع المعني</Label>
                <Select
                  value={form.branchId || '__general'}
                  onValueChange={(v) => setForm({ ...form, branchId: v === '__general' ? '' : v, memberId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__general">عامة لجميع الفروع</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>الإطار المعني بالوثيقة</Label>
                <Select
                  value={form.memberId || '__none'}
                  onValueChange={(v) => setForm({ ...form, memberId: v === '__none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الإطار (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">بلا إطار محدد</SelectItem>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} — {m.position}
                        {m.branch ? ` (${m.branch.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  ملفات الإطارات تُوزَّع حسب التخصص والتعيين — وتظهر في حساب الفرع بأمر من الإدارة.
                </p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>نص الوثيقة *</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={7}
                  placeholder="اكتب نص الوثيقة... (يُحفظ تنسيق الأسطر كما هو)"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3.5">
                <div>
                  <div className="font-bold text-sm text-(--club-dark)">إظهار في حساب الفرع</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    أمر الإدارة: تظهر هذه الوثيقة مباشرة في مكتب الفرع المعني (أو في كل الفروع إذا كانت عامة).
                  </p>
                </div>
                <Switch checked={form.visibleToBranch} onCheckedChange={(v) => setForm({ ...form, visibleToBranch: v })} />
              </div>
            </div>
          ) : (
            /* مصمم الورقة مع المعاينة الحية */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>نمط الورقة</Label>
                  <Select value={design.style} onValueChange={(v) => setDesign({ ...design, style: v as DocumentDesign['style'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">رسمي (إداري)</SelectItem>
                      <SelectItem value="minimal">مبسّط</SelectItem>
                      <SelectItem value="ceremonial">احتفالي (شهادات وشكر)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>لون الإطار والختم</Label>
                  <Select value={design.accent} onValueChange={(v) => setDesign({ ...design, accent: v as DocumentDesign['accent'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="navy">كحلي رسمي</SelectItem>
                      <SelectItem value="silver">فضي</SelectItem>
                      <SelectItem value="red">أحمر جزائري</SelectItem>
                      <SelectItem value="green">أخضر جزائري</SelectItem>
                      <SelectItem value="gold">ذهبي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>اسم الموقّع</Label>
                  <Input
                    value={design.signatureName}
                    onChange={(e) => setDesign({ ...design, signatureName: e.target.value })}
                    placeholder="رئيس النادي"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer">شعار النادي في الترويسة</Label>
                  <Switch checked={design.showLogo} onCheckedChange={(v) => setDesign({ ...design, showLogo: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer flex items-center gap-1.5">
                    <Stamp className="h-4 w-4" /> الختم الرسمي
                  </Label>
                  <Switch checked={design.showStamp} onCheckedChange={(v) => setDesign({ ...design, showStamp: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer">العلامة المائية (شعار خلفي)</Label>
                  <Switch checked={design.showWatermark} onCheckedChange={(v) => setDesign({ ...design, showWatermark: v })} />
                </div>
              </div>
              {/* المعاينة الحية */}
              <div>
                <div className="text-xs font-black text-(--club-dark) mb-2 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> معاينة حية للورقة
                </div>
                <div className="max-h-[430px] overflow-y-auto nice-scroll rounded-xl bg-muted/50 p-3">
                  <DocumentPaper
                    compact
                    doc={{
                      refNumber: form.refNumber,
                      title: form.title || 'عنوان الوثيقة',
                      type: form.type,
                      category: form.category,
                      content: form.content || 'نص الوثيقة يظهر هنا كما سيُطبع...',
                      design: JSON.stringify(design),
                      createdAt: new Date().toISOString(),
                      member: availableMembers.find((m) => m.id === form.memberId)
                        ? {
                            id: form.memberId,
                            firstName: availableMembers.find((m) => m.id === form.memberId)!.firstName,
                            lastName: availableMembers.find((m) => m.id === form.memberId)!.lastName,
                            position: availableMembers.find((m) => m.id === form.memberId)!.position,
                          }
                        : null,
                      branch: branches.find((b) => b.id === form.branchId)
                        ? {
                            name: branches.find((b) => b.id === form.branchId)!.name,
                            slug: branches.find((b) => b.id === form.branchId)!.slug,
                            color: branches.find((b) => b.id === form.branchId)!.color,
                          }
                        : null,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border)">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <BookOpen className="h-4 w-4 ml-1" />}
              {editing ? 'حفظ التعديلات' : 'تسجيل في كتب النادي'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة عرض الورقة */}
      <Dialog open={!!viewDoc} onOpenChange={(v) => !v && setViewDoc(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader className="doc-print-hide">
            <DialogTitle>عرض الورقة الرسمية</DialogTitle>
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
                  <Printer className="h-4 w-4 ml-1" /> طباعة الورقة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
