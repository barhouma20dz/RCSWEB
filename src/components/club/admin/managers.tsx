'use client'

import { useState } from 'react'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Star,
  KeyRound,
  Check,
  X,
  Users,
  Newspaper,
  CalendarDays,
  CalendarClock,
  Image as ImageIcon,
  Inbox,
  Mail,
  ShoppingBag,
  Package,
  Building2,
  UserCheck,
  Eye,
  EyeOff,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { BranchIcon } from '../icon-map'
import type {
  AdminData,
  BranchWithAccount,
  NewsItem,
  EnrollmentItem,
  ContactMessageItem,
  ShopOrderItem,
  ProductItem,
  AchievementItem,
} from '../types'

// ==================== استدعاءات API الإدارة ====================

async function adminBranchesApi(
  action: 'create' | 'update' | 'delete',
  data: object,
  credentials?: { username: string; password: string }
): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch('/api/admin/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data, credentials }),
  })
  const d = await res.json().catch(() => ({}))
  return { ok: res.ok, error: d.error }
}

async function adminItems(
  action: 'create' | 'update' | 'delete',
  type: string,
  payload: { id?: string; data?: object } = {}
): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch('/api/admin/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, type, ...payload }),
  })
  const d = await res.json().catch(() => ({}))
  return { ok: res.ok, error: d.error }
}

async function adminAccounts(
  branchId: string,
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch('/api/admin/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchId, username, password }),
  })
  const d = await res.json().catch(() => ({}))
  return { ok: res.ok, error: d.error }
}

function formatDate(iso: string) {
  return formatDateDMY(iso)
}

// ==================== عناصر واجهة مشتركة ====================

export function PanelHeader({
  title,
  desc,
  onAdd,
  addLabel,
}: {
  title: string
  desc: string
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="font-black text-lg text-(--club-dark)">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      {onAdd && (
        <Button onClick={onAdd} className="bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) font-bold shrink-0">
          <Plus className="ml-1 h-4 w-4" /> {addLabel}
        </Button>
      )}
    </div>
  )
}

function AEmpty({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function ADialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`max-h-[85vh] overflow-y-auto nice-scroll ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <DialogHeader>
          <DialogTitle className="font-black text-(--club-dark)">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function AField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function ASave({ saving, onClick, label }: { saving: boolean; onClick: () => void; label: string }) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      className="w-full h-11 font-black bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark)"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      {saving ? 'جارٍ الحفظ...' : label}
    </Button>
  )
}

function AConfirm({
  open,
  onClose,
  onConfirm,
  name,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  name?: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            هل أنت متأكد من حذف <strong>{name || 'هذا العنصر'}</strong>؟ لا يمكن التراجع عن هذه العملية.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            نعم، احذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'معلق', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
    accepted: { label: 'مقبول', cls: 'bg-green-100 text-green-800 border border-green-300' },
    rejected: { label: 'مرفوض', cls: 'bg-red-100 text-red-700 border border-red-300' },
    done: { label: 'تم التسليم', cls: 'bg-green-100 text-green-800 border border-green-300' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-(--club-light) text-(--club-dark) border border-(--border)' }
  return <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

function BranchBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="text-[11px] text-white font-bold px-2.5 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  )
}

// ==================== إدارة الفروع ====================

const PALETTE = [
  '#166534', '#15803d', '#0e7490', '#0f766e',
  '#4d7c0f', '#b45309', '#ca8a04', '#92400e',
  '#b91c1c', '#be123c', '#7c3aed', '#c026d3',
]

const ICON_OPTIONS = [
  'Goal', 'Dribbble', 'Hand', 'Volleyball', 'Timer', 'Swords', 'Waves',
  'CircleDot', 'Brain', 'Bike', 'PersonStanding', 'Flame', 'Trophy',
]

type BranchForm = {
  name: string
  slug: string
  color: string
  icon: string
  motto: string
  description: string
  image: string
  visible: boolean
  sortOrder: string
}

function BranchFormDialog({
  open,
  edit,
  onClose,
  onSaved,
}: {
  open: boolean
  edit: BranchWithAccount | null
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<BranchForm>({
    name: edit?.name ?? '',
    slug: edit?.slug ?? '',
    color: edit?.color ?? PALETTE[0],
    icon: edit?.icon ?? 'Goal',
    motto: edit?.motto ?? '',
    description: edit?.description ?? '',
    image: edit?.image ?? '',
    visible: edit?.visible ?? true,
    sortOrder: edit?.sortOrder?.toString() ?? '0',
  })

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'اسم الفرع مطلوب', variant: 'destructive' })
      return
    }
    setSaving(true)
    const data = {
      ...(edit ? { id: edit.id } : {}),
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      color: form.color,
      icon: form.icon,
      motto: form.motto,
      description: form.description,
      image: form.image,
      visible: form.visible,
      sortOrder: Number(form.sortOrder) || 0,
    }
    const r = await adminBranchesApi(edit ? 'update' : 'create', data)
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث الفرع' : 'تم إنشاء الفرع' })
    onSaved()
    onClose()
  }

  return (
    <ADialog open={open} onClose={onClose} title={edit ? `تعديل فرع ${edit.name}` : 'إنشاء فرع جديد'} wide>
      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <AField label="اسم الفرع *">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: كرة السلة"
            />
          </AField>
          <AField label="المعرف (اتركه فارغاً ليُولد تلقائياً)">
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="basketball"
              dir="ltr"
              className="text-right"
            />
          </AField>
        </div>

        <AField label="لون الفرع">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                aria-label={`اللون ${c}`}
                className={`h-9 w-9 rounded-lg transition-transform ${
                  form.color === c ? 'ring-2 ring-offset-2 ring-(--silver) scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </AField>

        <AField label="أيقونة الفرع">
          <div className="grid grid-cols-7 gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setForm({ ...form, icon: ic })}
                aria-label={ic}
                className={`h-10 rounded-lg flex items-center justify-center transition-all ${
                  form.icon === ic
                    ? 'text-white shadow-md'
                    : 'bg-(--club-light) text-(--club-dark) hover:bg-(--accent)'
                }`}
                style={form.icon === ic ? { backgroundColor: form.color } : undefined}
              >
                <BranchIcon name={ic} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </AField>

        <AField label="الشعار (موتّو)">
          <Input
            value={form.motto}
            onChange={(e) => setForm({ ...form, motto: e.target.value })}
            placeholder="مثال: العقول الذهبية"
          />
        </AField>

        <AField label="وصف الفرع">
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="نبذة عن الفرع و نشاطاته..."
          />
        </AField>

        <div className="grid sm:grid-cols-2 gap-3">
          <AField label="رابط صورة الفرع">
            <Input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              dir="ltr"
              className="text-right"
              placeholder="/images/branches/football.jpg"
            />
          </AField>
          <AField label="ترتيب الظهور">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              dir="ltr"
              className="text-right"
            />
          </AField>
        </div>

        {/* إظهار أو إخفاء الفرع من الموقع كاملاً */}
        <div className="flex items-center justify-between rounded-xl border border-(--border) bg-(--club-light)/50 p-3.5">
          <div>
            <div className="font-bold text-sm text-(--club-dark) flex items-center gap-1.5">
              {form.visible ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              إظهار الفرع في الموقع
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              عند الإخفاء يختفي الفرع من فروعنا الرياضية، الأخبار، المباريات، استمارة الانضمام والتذييل.
            </p>
          </div>
          <Switch
            checked={form.visible}
            onCheckedChange={(v) => setForm({ ...form, visible: v })}
            aria-label="إظهار الفرع في الموقع"
          />
        </div>

        <ASave saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إنشاء الفرع'} />
      </div>
    </ADialog>
  )
}

function AccountDialog({
  branch,
  onClose,
  onSaved,
}: {
  branch: BranchWithAccount | null
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [username, setUsername] = useState(branch?.accountUsername ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!branch) return
    if (!username.trim()) {
      toast({ title: 'اسم المستخدم مطلوب', variant: 'destructive' })
      return
    }
    if (password.length < 6) {
      toast({ title: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' })
      return
    }
    setSaving(true)
    const r = await adminAccounts(branch.id, username.trim(), password)
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حفظ حساب المكتب' })
    onSaved()
    onClose()
  }

  return (
    <ADialog open={!!branch} onClose={onClose} title={`حساب مكتب فرع ${branch?.name ?? ''}`}>
      <div className="space-y-3">
        {branch?.accountUsername && (
          <p className="text-xs text-muted-foreground bg-(--club-light) rounded-lg px-3 py-2">
            الحساب الحالي: <strong dir="ltr">{branch.accountUsername}</strong> — سيتم استبداله عند الحفظ
          </p>
        )}
        <AField label="اسم المستخدم *">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            dir="ltr"
            className="text-right"
            placeholder="football"
            autoComplete="off"
          />
        </AField>
        <AField label="كلمة المرور * (6 أحرف على الأقل)">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            className="text-right"
            placeholder="••••••"
            autoComplete="new-password"
          />
        </AField>
        <ASave saving={saving} onClick={save} label="حفظ الحساب" />
      </div>
    </ADialog>
  )
}

export function BranchesManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [edit, setEdit] = useState<BranchWithAccount | null>(null)
  const [accountBranch, setAccountBranch] = useState<BranchWithAccount | null>(null)
  const [del, setDel] = useState<BranchWithAccount | null>(null)
  const [busyVisible, setBusyVisible] = useState<string | null>(null)

  const remove = async () => {
    if (!del) return
    const r = await adminBranchesApi('delete', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حذف الفرع' })
    setDel(null)
    reload()
  }

  /** إظهار أو إخفاء الفرع من الموقع كاملاً — ينعكس فوراً على الصفحة الرئيسية */
  const toggleVisible = async (b: BranchWithAccount) => {
    setBusyVisible(b.id)
    const r = await adminBranchesApi('update', { id: b.id, visible: !b.visible })
    setBusyVisible(null)
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({
      title: b.visible ? `تم إخفاء فرع ${b.name} من الموقع` : `تم إظهار فرع ${b.name} في الموقع`,
      description: b.visible
        ? 'اختفى الفرع من فروعنا الرياضية، الأخبار، المباريات، استمارة الانضمام والتذييل'
        : 'الفرع ظاهر الآن في كل أقسام الصفحة الرئيسية',
    })
    reload()
  }

  return (
    <div>
      <PanelHeader
        title="إدارة الفروع"
        desc="إنشاء وتعديل الفروع الرياضية وألوانها وأيقوناتها وحسابات مكاتبها — وإظهار أو إخفاء أي فرع من الموقع"
        onAdd={() => {
          setEdit(null)
          setFormOpen(true)
        }}
        addLabel="فرع جديد"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {data.branches.map((b) => (
          <div
            key={b.id}
            className={`rounded-2xl border p-4 transition-all ${
              b.visible ? 'border-(--border) bg-white' : 'border-dashed border-(--border) bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                  b.visible ? '' : 'opacity-50 grayscale'
                }`}
                style={{ backgroundColor: b.color }}
              >
                <BranchIcon name={b.icon} className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-(--club-dark) text-sm truncate flex items-center gap-1.5">
                  {b.name}
                  {!b.visible && (
                    <span className="text-[9px] font-black bg-muted text-muted-foreground border border-(--border) px-1.5 py-0.5 rounded-full shrink-0">
                      مخفي
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate" dir="ltr">
                  /{b.slug}
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="تعديل الفرع"
                  onClick={() => {
                    setEdit(b)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="حساب المكتب"
                  onClick={() => setAccountBranch(b)}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  aria-label="حذف الفرع"
                  onClick={() => setDel(b)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* مفتاح الإظهار/الإخفاء — متزامن مع الصفحة الرئيسية في كل الأماكن */}
            <div className="flex items-center justify-between rounded-xl border border-(--border) bg-(--club-light)/60 px-3 py-2 mt-2.5">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-black ${
                  b.visible ? 'text-green-700' : 'text-muted-foreground'
                }`}
              >
                {busyVisible === b.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : b.visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {b.visible ? 'ظاهر في الموقع' : 'مخفي من الموقع'}
              </span>
              <Switch
                checked={b.visible}
                disabled={busyVisible === b.id}
                onCheckedChange={() => toggleVisible(b)}
                aria-label={`إظهار أو إخفاء فرع ${b.name}`}
              />
            </div>

            {b.motto && <p className="text-xs text-(--silver) font-bold mt-2 truncate">{b.motto}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-1 bg-(--club-light) px-2 py-0.5 rounded-md">
                <Users className="h-3 w-3" /> {b.counts.players}
              </span>
              <span className="inline-flex items-center gap-1 bg-(--club-light) px-2 py-0.5 rounded-md">
                <Newspaper className="h-3 w-3" /> {b.counts.news}
              </span>
              <span className="inline-flex items-center gap-1 bg-(--club-light) px-2 py-0.5 rounded-md">
                <CalendarDays className="h-3 w-3" /> {b.counts.matches}
              </span>
              <span className="inline-flex items-center gap-1 bg-(--club-light) px-2 py-0.5 rounded-md">
                <CalendarClock className="h-3 w-3" /> {b.counts.trainings}
              </span>
              <span className="inline-flex items-center gap-1 bg-(--club-light) px-2 py-0.5 rounded-md">
                <Inbox className="h-3 w-3" /> {b.counts.enrollments}
              </span>
              <span className="inline-flex items-center gap-1 bg-(--club-light) px-2 py-0.5 rounded-md">
                <ImageIcon className="h-3 w-3" /> {b.counts.gallery}
              </span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-(--border)">
              {b.accountUsername ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700">
                  <UserCheck className="h-3.5 w-3.5" />
                  المكتب: <span dir="ltr">{b.accountUsername}</span>
                </span>
              ) : (
                <button
                  onClick={() => setAccountBranch(b)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-(--silver) hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  لا يوجد حساب مكتب — إنشاء حساب
                </button>
              )}
            </div>
          </div>
        ))}
        {data.branches.length === 0 && <AEmpty icon={Building2} text="لا توجد فروع بعد" />}
      </div>

      {formOpen && (
        <BranchFormDialog
          key={edit?.id ?? 'new'}
          open={formOpen}
          edit={edit}
          onClose={() => setFormOpen(false)}
          onSaved={reload}
        />
      )}
      <AccountDialog
        key={accountBranch?.id ?? 'none'}
        branch={accountBranch}
        onClose={() => setAccountBranch(null)}
        onSaved={reload}
      />
      <AConfirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.name} />
    </div>
  )
}

// ==================== طلبات الانضمام ====================

export function EnrollmentsManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [del, setDel] = useState<(EnrollmentItem & { branch: { name: string; color: string; slug: string } }) | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const filtered = data.enrollments.filter(
    (e) =>
      (branchFilter === 'all' || e.branch.slug === branchFilter) &&
      (statusFilter === 'all' || e.status === statusFilter)
  )

  const setStatus = async (e: EnrollmentItem, status: 'accepted' | 'rejected') => {
    setBusy(e.id)
    const r = await adminItems('update', 'enrollment', { id: e.id, data: { status } })
    setBusy(null)
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: status === 'accepted' ? 'تم قبول الطلب' : 'تم رفض الطلب' })
    reload()
  }

  const remove = async () => {
    if (!del) return
    const r = await adminItems('delete', 'enrollment', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حذف الطلب' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <PanelHeader title="طلبات الانضمام" desc="مراجعة وقبول أو رفض طلبات الانضمام من جميع الفروع" />

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={branchFilter} onValueChange={setBranchFilter} dir="rtl">
          <SelectTrigger className="w-44 bg-white">
            <SelectValue placeholder="كل الفروع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفروع</SelectItem>
            {data.branches.map((b) => (
              <SelectItem key={b.id} value={b.slug}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
          <SelectTrigger className="w-40 bg-white">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="pending">معلق</SelectItem>
            <SelectItem value="accepted">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((e) => {
          const isMinor = !!e.parentName
          // صيغة التاريخ الموحدة: يوم/شهر/سنة
          const bdDisplay = formatDateDMY(e.birthDate)
          return (
            <div
              key={e.id}
              className="rounded-xl border border-(--border) bg-white px-4 py-3 flex flex-wrap items-center gap-3 shadow-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                  {e.fullName || `${e.firstName} ${e.lastName}`}
                  {e.gender === 'male' && <Badge variant="secondary" className="text-[10px]">ذكر</Badge>}
                  {e.gender === 'female' && <Badge variant="secondary" className="text-[10px]">أنثى</Badge>}
                  {isMinor && <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">قاصر</Badge>}
                  <BranchBadge name={e.branch.name} color={e.branch.color} />
                  <StatusChip status={e.status} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                  {bdDisplay && <span dir="ltr">{bdDisplay}</span>}
                  <span>{e.age} سنة</span>
                  <span dir="ltr">{e.phone}</span>
                  <span>{formatDate(e.createdAt)}</span>
                  {e.address && <span>{isMinor ? 'عنوان ولي الأمر:' : 'العنوان:'} {e.address}</span>}
                  {isMinor && <span>ولي الأمر: {e.parentName}</span>}
                  {e.note && <span className="truncate max-w-56">ملاحظة: {e.note}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {e.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      disabled={busy === e.id}
                      onClick={() => setStatus(e, 'accepted')}
                    >
                      {busy === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 font-bold"
                      disabled={busy === e.id}
                      onClick={() => setStatus(e, 'rejected')}
                    >
                      <X className="h-4 w-4" />
                      رفض
                    </Button>
                  </>
                )}
                <Button size="icon" variant="ghost" className="text-destructive" aria-label="حذف الطلب" onClick={() => setDel(e)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <AEmpty icon={Inbox} text="لا توجد طلبات مطابقة للفلاتر" />}
      </div>

      <AConfirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.fullName} />
    </div>
  )
}

// ==================== الأخبار ====================

export function NewsAdminManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<NewsItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<NewsItem | null>(null)
  const [form, setForm] = useState({ title: '', content: '', featured: false })

  const startEdit = (n: NewsItem) => {
    setEdit(n)
    setForm({ title: n.title, content: n.content, featured: n.featured })
    setOpen(true)
  }

  const save = async () => {
    if (!edit) return
    setSaving(true)
    const r = await adminItems('update', 'news', { id: edit.id, data: form })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم تحديث الخبر' })
    setOpen(false)
    reload()
  }

  const remove = async () => {
    if (!del) return
    const r = await adminItems('delete', 'news', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حذف الخبر' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <PanelHeader title="كل الأخبار" desc="تعديل أو حذف أخبار جميع الفروع — الإضافة تتم من مكاتب الفروع" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {data.news.map((n) => (
          <div key={n.id} className="rounded-xl border border-(--border) bg-white p-3 flex gap-3 items-center shadow-xs">
            {n.image && <img src={n.image} alt={n.title} className="h-14 w-20 rounded-lg object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                {n.title}
                <BranchBadge name={n.branch.name} color={n.branch.color} />
                {n.featured && <Star className="h-3.5 w-3.5 text-(--silver) fill-(--silver) shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.content}</p>
              <span className="text-[10px] text-(--silver) font-bold">{formatDate(n.createdAt)}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => startEdit(n)} aria-label="تعديل">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDel(n)} aria-label="حذف">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {data.news.length === 0 && <div className="col-span-full"><AEmpty icon={Newspaper} text="لا توجد أخبار بعد" /></div>}
      </div>

      <ADialog open={open} onClose={() => setOpen(false)} title="تعديل الخبر">
        <div className="space-y-3">
          <AField label="عنوان الخبر *">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </AField>
          <AField label="محتوى الخبر *">
            <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </AField>
          <div className="flex items-center justify-between rounded-xl bg-(--club-light) px-4 py-3">
            <span className="text-sm font-bold flex items-center gap-2">
              <Star className="h-4 w-4 text-(--silver)" /> خبر مميز (يظهر في الصدارة)
            </span>
            <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
          </div>
          <ASave saving={saving} onClick={save} label="حفظ التعديلات" />
        </div>
      </ADialog>
      <AConfirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.title} />
    </div>
  )
}

// ==================== الرسائل ====================

export function MessagesManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [del, setDel] = useState<ContactMessageItem | null>(null)

  const remove = async () => {
    if (!del) return
    const r = await adminItems('delete', 'message', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حذف الرسالة' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <PanelHeader title="رسائل التواصل" desc="رسائل الزوار الواردة من نموذج التواصل في الموقع" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {data.messages.map((m) => (
          <div key={m.id} className="rounded-xl border border-(--border) bg-white p-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-sm">{m.name}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3" dir="ltr">
                  {m.email && <span>{m.email}</span>}
                  {m.phone && <span>{m.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-(--silver) font-bold">{formatDate(m.createdAt)}</span>
                <Button size="icon" variant="ghost" className="text-destructive" aria-label="حذف الرسالة" onClick={() => setDel(m)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm mt-2 leading-relaxed text-foreground/85">{m.message}</p>
          </div>
        ))}
        {data.messages.length === 0 && <div className="col-span-full"><AEmpty icon={Mail} text="لا توجد رسائل بعد" /></div>}
      </div>

      <AConfirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.name} />
    </div>
  )
}

// ==================== المتجر ====================

function ProductFormDialog({
  open,
  edit,
  onClose,
  onSaved,
}: {
  open: boolean
  edit: ProductItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: edit?.name ?? '',
    price: edit?.price?.toString() ?? '',
    category: edit?.category ?? '',
    description: edit?.description ?? '',
    image: edit?.image ?? '',
    active: edit?.active ?? true,
  })

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'اسم المنتج مطلوب', variant: 'destructive' })
      return
    }
    setSaving(true)
    const r = await adminItems(edit ? 'update' : 'create', 'product', {
      ...(edit ? { id: edit.id } : {}),
      data: {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        category: form.category,
        description: form.description,
        image: form.image,
        active: form.active,
      },
    })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث المنتج' : 'تمت إضافة المنتج' })
    onSaved()
    onClose()
  }

  return (
    <ADialog open={open} onClose={onClose} title={edit ? 'تعديل المنتج' : 'منتج جديد'}>
      <div className="space-y-3">
        <AField label="اسم المنتج *">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: قميص الفريق الأول" />
        </AField>
        <div className="grid grid-cols-2 gap-3">
          <AField label="السعر (دج) *">
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              dir="ltr"
              className="text-right"
              placeholder="3500"
            />
          </AField>
          <AField label="الفئة">
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="ملابس، إكسسوارات..."
            />
          </AField>
        </div>
        <AField label="الوصف">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </AField>
        <AField label="رابط الصورة">
          <Input
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            dir="ltr"
            className="text-right"
            placeholder="/images/products/shirt.jpg"
          />
        </AField>
        <div className="flex items-center justify-between rounded-xl bg-(--club-light) px-4 py-3">
          <span className="text-sm font-bold">معروض في المتجر</span>
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        </div>
        <ASave saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إضافة المنتج'} />
      </div>
    </ADialog>
  )
}

export function ShopAdminManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<ProductItem | null>(null)
  const [delProduct, setDelProduct] = useState<ProductItem | null>(null)
  const [delOrder, setDelOrder] = useState<ShopOrderItem | null>(null)

  const removeProduct = async () => {
    if (!delProduct) return
    const r = await adminItems('delete', 'product', { id: delProduct.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حذف المنتج' })
    setDelProduct(null)
    reload()
  }

  const removeOrder = async () => {
    if (!delOrder) return
    const r = await adminItems('delete', 'order', { id: delOrder.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حذف الطلب' })
    setDelOrder(null)
    reload()
  }

  const markDone = async (o: ShopOrderItem) => {
    const r = await adminItems('update', 'order', { id: o.id, data: { status: 'done' } })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم تعليم الطلب كمُسلَّم' })
    reload()
  }

  return (
    <div>
      <PanelHeader title="متجر النادي" desc="إدارة المنتجات ومتابعة طلبات الشراء" />

      <Tabs defaultValue="products" dir="rtl">
        <TabsList className="bg-white border border-(--border) p-1 rounded-xl mb-4">
          <TabsTrigger
            value="products"
            className="rounded-lg data-[state=active]:bg-(--silver) data-[state=active]:text-(--club-dark) font-bold"
          >
            <Package className="inline ml-1 h-4 w-4" />
            المنتجات ({data.products.length})
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-lg data-[state=active]:bg-(--silver) data-[state=active]:text-(--club-dark) font-bold"
          >
            <ShoppingBag className="inline ml-1 h-4 w-4" />
            الطلبات ({data.orders.filter((o) => o.status === 'pending').length} معلق)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex justify-end mb-3">
            <Button
              onClick={() => {
                setEdit(null)
                setOpen(true)
              }}
              className="bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) font-bold"
            >
              <Plus className="ml-1 h-4 w-4" /> منتج جديد
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data.products.map((p) => (
              <div key={p.id} className="rounded-xl border border-(--border) bg-white overflow-hidden group relative shadow-xs hover:shadow-md transition-shadow">
                <div className="aspect-square bg-(--club-light)">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full club-gradient flex items-center justify-center">
                      <Package className="h-8 w-8 text-white/60" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="font-bold text-xs truncate">{p.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-(--silver) font-black text-sm" dir="ltr">
                      {p.price.toLocaleString('ar-DZ')} دج
                    </span>
                    {p.active ? (
                      <Badge className="bg-green-100 text-green-800 text-[10px] hover:bg-green-100">معروض</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">مخفي</Badge>
                    )}
                  </div>
                  {p.category && <div className="text-[10px] text-muted-foreground mt-0.5">{p.category}</div>}
                </div>
                <div className="absolute top-1.5 left-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 bg-white/90 shadow-sm"
                    aria-label="تعديل المنتج"
                    onClick={() => {
                      setEdit(p)
                      setOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 bg-white/90 text-destructive shadow-sm"
                    aria-label="حذف المنتج"
                    onClick={() => setDelProduct(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {data.products.length === 0 && (
              <div className="col-span-full">
                <AEmpty icon={Package} text="لا توجد منتجات بعد" />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="space-y-3">
            {data.orders.map((o) => (
              <div
                key={o.id}
                className="rounded-xl border border-(--border) bg-white px-4 py-3 flex flex-wrap items-center gap-3 shadow-xs"
              >
                {o.product.image && (
                  <img src={o.product.image} alt={o.product.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                    {o.product.name}
                    <StatusChip status={o.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                    <span>{o.customerName}</span>
                    <span dir="ltr">{o.phone}</span>
                    {o.size && <span>مقاس: {o.size}</span>}
                    <span dir="ltr" className="font-bold text-(--silver)">
                      {o.product.price.toLocaleString('ar-DZ')} دج
                    </span>
                    <span>{formatDate(o.createdAt)}</span>
                    {o.note && <span className="truncate max-w-48">ملاحظة: {o.note}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {o.status === 'pending' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      onClick={() => markDone(o)}
                    >
                      <Check className="h-4 w-4" />
                      تم التسليم
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="text-destructive" aria-label="حذف الطلب" onClick={() => setDelOrder(o)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {data.orders.length === 0 && <AEmpty icon={ShoppingBag} text="لا توجد طلبات بعد" />}
          </div>
        </TabsContent>
      </Tabs>

      {open && (
        <ProductFormDialog
          key={edit?.id ?? 'new'}
          open={open}
          edit={edit}
          onClose={() => setOpen(false)}
          onSaved={reload}
        />
      )}
      <AConfirm open={!!delProduct} onClose={() => setDelProduct(null)} onConfirm={removeProduct} name={delProduct?.name} />
      <AConfirm open={!!delOrder} onClose={() => setDelOrder(null)} onConfirm={removeOrder} name={delOrder?.customerName} />
    </div>
  )
}

// ==================== إدارة الإنجازات والألقاب ====================

type AchievementForm = {
  title: string
  year: string
  description: string
  branchId: string
}

function AchievementDialog({
  open,
  edit,
  branches,
  onClose,
  onSaved,
}: {
  open: boolean
  edit: AchievementItem | null
  branches: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AchievementForm>({
    title: edit?.title ?? '',
    year: edit?.year ?? new Date().getFullYear().toString(),
    description: edit?.description ?? '',
    branchId: edit?.branchId ?? 'none',
  })

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: 'عنوان الإنجاز مطلوب', variant: 'destructive' })
      return
    }
    if (!form.year.trim()) {
      toast({ title: 'سنة الإنجاز مطلوبة', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      year: form.year.trim(),
      description: form.description.trim(),
      branchId: form.branchId === 'none' ? null : form.branchId,
    }
    const r = await adminItems(edit ? 'update' : 'create', 'achievement', {
      ...(edit ? { id: edit.id } : {}),
      data: payload,
    })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'فشل حفظ الإنجاز', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث الإنجاز بنجاح' : 'تمت إضافة الإنجاز بنجاح' })
    onSaved()
    onClose()
  }

  return (
    <ADialog open={open} onClose={onClose} title={edit ? 'تعديل الإنجاز / اللقب' : 'تسجيل إنجاز أو لقب جديد'}>
      <div className="space-y-3.5">
        <AField label="عنوان الإنجاز أو اللقب *">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: بطل كأس الولاية، الميدالية الذهبية الوطنية..."
          />
        </AField>

        <div className="grid grid-cols-2 gap-3">
          <AField label="السنة / الموسم *">
            <Input
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="مثال: 2026 أو 2025/2026"
              dir="ltr"
              className="text-right"
            />
          </AField>

          <AField label="الفرع المعني">
            <Select
              value={form.branchId}
              onValueChange={(v) => setForm({ ...form, branchId: v })}
              dir="rtl"
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">عام (لكل النادي)</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AField>
        </div>

        <AField label="تفاصيل الإنجاز (اختياري)">
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="وصف إضافي، الفئة العمرية، المنافسة، أو اسم الفريق والمدرب..."
          />
        </AField>

        <ASave saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'تسجيل الإنجاز'} />
      </div>
    </ADialog>
  )
}

export function AchievementsManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<AchievementItem | null>(null)
  const [del, setDel] = useState<AchievementItem | null>(null)
  const [branchFilter, setBranchFilter] = useState('all')
  const { toast } = useToast()

  const achievements = data.achievements ?? []
  const filtered = achievements.filter((a) => {
    if (branchFilter === 'all') return true
    if (branchFilter === 'general') return !a.branchId
    return a.branchId === branchFilter
  })

  const remove = async () => {
    if (!del) return
    const r = await adminItems('delete', 'achievement', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ غير متوقع', variant: 'destructive' })
    toast({ title: 'تم حذف الإنجاز' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <PanelHeader
        title="الإنجازات والألقاب"
        desc="تسجيل الألقاب والبطولات والتتويجات يدوياً وتخصيصها للفروع الرياضية — تظهر في سجل الشرف بالصفحة الرئيسية"
        onAdd={() => {
          setEdit(null)
          setOpen(true)
        }}
        addLabel="إنجاز جديد"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={branchFilter} onValueChange={setBranchFilter} dir="rtl">
          <SelectTrigger className="w-56 bg-white">
            <SelectValue placeholder="تصفية حسب الفرع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الإنجازات ({achievements.length})</SelectItem>
            <SelectItem value="general">إنجازات عامة للنادي</SelectItem>
            {data.branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((a) => {
          const branch = data.branches.find((b) => b.id === a.branchId)
          return (
            <div
              key={a.id}
              className="rounded-2xl border border-(--border) bg-white p-4 shadow-xs hover:shadow-md transition-shadow relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <span className="font-black text-xs px-2.5 py-1 rounded-full bg-(--club-light) text-(--club-dark) border border-(--border)">
                    {a.year}
                  </span>
                </div>

                <h4 className="font-black text-base text-(--club-dark) line-clamp-2">{a.title}</h4>

                {branch ? (
                  <div className="mt-2">
                    <BranchBadge name={branch.name} color={branch.color} />
                  </div>
                ) : (
                  <div className="mt-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      إنجاز عام للنادي
                    </span>
                  </div>
                )}

                {a.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {a.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-(--border)/60">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs font-bold text-foreground hover:bg-muted"
                  onClick={() => {
                    setEdit(a)
                    setOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 ml-1" />
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs font-bold text-destructive hover:bg-destructive/10"
                  onClick={() => setDel(a)}
                >
                  <Trash2 className="h-3.5 w-3.5 ml-1" />
                  حذف
                </Button>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full">
            <AEmpty icon={Trophy} text="لا توجد إنجازات مسجلة بعد — أضف أول لقب أو بطولة للنادي الآن" />
          </div>
        )}
      </div>

      {open && (
        <AchievementDialog
          open={open}
          edit={edit}
          branches={data.branches}
          onClose={() => setOpen(false)}
          onSaved={reload}
        />
      )}

      <AConfirm
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={remove}
        name={del?.title}
      />
    </div>
  )
}
