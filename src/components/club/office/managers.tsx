'use client'

import { useState } from 'react'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Star,
  CalendarDays,
  MapPin,
  User,
  Phone,
  Check,
  X,
  Clock,
  Trophy,
  Newspaper,
  Users,
  Image as ImageIcon,
  CalendarClock,
  Inbox,
  Settings,
  ListOrdered,
  PlayCircle,
  Clapperboard,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { MatchRow, GalleryGrid } from '../branches'
import type { OfficeData, NewsItem, PlayerItem, MatchItem, TrainingItem, GalleryImage, StandingItem, VideoItem } from '../types'

type Office = { data: OfficeData; reload: () => void }

async function officeItem(
  action: 'create' | 'update' | 'delete',
  type: string,
  payload: { id?: string; data?: object }
): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch('/api/office/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, type, ...payload }),
  })
  const d = await res.json()
  return { ok: res.ok, error: d.error }
}

function formatDate(iso: string) {
  return formatDateDMY(iso)
}

// ==================== إدارة الأخبار ====================
export function NewsManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<NewsItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<NewsItem | null>(null)
  const [form, setForm] = useState({ title: '', content: '', image: '', featured: false })

  const startCreate = () => {
    setEdit(null)
    setForm({ title: '', content: '', image: '', featured: false })
    setOpen(true)
  }
  const startEdit = (n: NewsItem) => {
    setEdit(n)
    setForm({ title: n.title, content: n.content, image: n.image, featured: n.featured })
    setOpen(true)
  }
  const save = async () => {
    setSaving(true)
    const r = await officeItem(edit ? 'update' : 'create', 'news', { id: edit?.id, data: form })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث الخبر ✅' : 'تم نشر الخبر ✅' })
    setOpen(false)
    reload()
  }
  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', 'news', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف الخبر' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <ManagerHeader title="إدارة الأخبار" desc="انشر أخبار الفرع ونتائجه وتتويجاته ليظهر على الموقع مباشرة" onAdd={startCreate} addLabel="خبر جديد" />
      <div className="space-y-3 max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {data.news.map((n) => (
          <div key={n.id} className="rounded-xl border border-(--border) bg-white p-4 flex gap-3 items-start">
            {n.image && (
               
              <img src={n.image} alt={n.title} className="h-16 w-24 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm flex items-center gap-2">
                <span className="truncate">{n.title}</span>
                {n.featured && <Star className="h-3.5 w-3.5 text-(--silver) fill-(--silver) shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.content}</p>
              <span className="text-[10px] text-(--silver) font-bold">{formatDate(n.createdAt)}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => startEdit(n)} aria-label="تعديل"><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDel(n)} aria-label="حذف"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {data.news.length === 0 && <EmptyState icon={Newspaper} text="لا توجد أخبار منشورة بعد" />}
      </div>

      <ItemDialog open={open} onClose={() => setOpen(false)} title={edit ? 'تعديل الخبر' : 'نشر خبر جديد'}>
        <div className="space-y-3">
          <Field label="عنوان الخبر *">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="اكتب عنواناً جذاباً" />
          </Field>
          <Field label="محتوى الخبر *">
            <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="اكتب تفاصيل الخبر..." />
          </Field>
          <Field label="رابط صورة الخبر">
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} dir="ltr" placeholder="/images/branches/football.jpg" />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-(--club-light) px-4 py-3">
            <span className="text-sm font-bold flex items-center gap-2"><Star className="h-4 w-4 text-(--silver)" /> خبر مميز (يظهر في الصدارة)</span>
            <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
          </div>
          <SaveButton saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'نشر الخبر'} />
        </div>
      </ItemDialog>
      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.title} />
    </div>
  )
}

// ==================== إدارة اللاعبين ====================
export function PlayersManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<PlayerItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<PlayerItem | null>(null)
  const [form, setForm] = useState({ name: '', position: '', number: '', age: '', photo: '' })

  const startCreate = () => {
    setEdit(null)
    setForm({ name: '', position: '', number: '', age: '', photo: '' })
    setOpen(true)
  }
  const startEdit = (p: PlayerItem) => {
    setEdit(p)
    setForm({ name: p.name, position: p.position, number: p.number?.toString() ?? '', age: p.age?.toString() ?? '', photo: p.photo })
    setOpen(true)
  }
  const save = async () => {
    setSaving(true)
    const r = await officeItem(edit ? 'update' : 'create', 'players', { id: edit?.id, data: form })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث بيانات اللاعب ✅' : 'تمت إضافة اللاعب ✅' })
    setOpen(false)
    reload()
  }
  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', 'players', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف اللاعب' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <ManagerHeader title="إدارة اللاعبين" desc="سجل لاعبي الفرع وأرقامهم ومواقعهم" onAdd={startCreate} addLabel="لاعب جديد" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {data.players.map((p) => (
          <div key={p.id} className="rounded-xl border border-(--border) bg-white p-4 text-center relative group">
            <div
              className="mx-auto mb-2 h-14 w-14 rounded-full flex items-center justify-center text-white font-black text-xl"
              style={{ backgroundColor: data.branch.color }}
            >
              {p.number ?? p.name.charAt(0)}
            </div>
            <div className="font-bold text-sm truncate">{p.name}</div>
            <div className="text-xs text-muted-foreground truncate">{p.position}</div>
            {p.age && <div className="text-xs text-(--silver) font-bold">{p.age} سنة</div>}
            <div className="absolute top-1.5 left-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(p)} aria-label="تعديل"><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDel(p)} aria-label="حذف"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {data.players.length === 0 && (
          <div className="col-span-full"><EmptyState icon={Users} text="لا يوجد لاعبون مسجلون بعد" /></div>
        )}
      </div>

      <ItemDialog open={open} onClose={() => setOpen(false)} title={edit ? 'تعديل اللاعب' : 'إضافة لاعب جديد'}>
        <div className="space-y-3">
          <Field label="اسم اللاعب *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الرقم">
              <Input type="number" min={0} max={99} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="10" dir="ltr" className="text-right" />
            </Field>
            <Field label="العمر">
              <Input type="number" min={5} max={60} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="20" dir="ltr" className="text-right" />
            </Field>
          </div>
          <Field label="الموقع / التخصص">
            <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="مهاجم، حارس، وسط..." />
          </Field>
          <Field label="رابط صورة اللاعب">
            <Input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} dir="ltr" placeholder="https://..." />
          </Field>
          <SaveButton saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إضافة اللاعب'} />
        </div>
      </ItemDialog>
      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.name} />
    </div>
  )
}

// ==================== إدارة المباريات ====================
export function MatchesManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<MatchItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<MatchItem | null>(null)
  const empty = { opponent: '', date: '', time: '16:00', venue: 'home', location: '', competition: '', homeScore: '', awayScore: '', status: 'upcoming' }
  const [form, setForm] = useState(empty)

  const startCreate = () => {
    setEdit(null)
    setForm(empty)
    setOpen(true)
  }
  const startEdit = (m: MatchItem) => {
    setEdit(m)
    const d = new Date(m.date)
    const pad = (n: number) => String(n).padStart(2, '0')
    setForm({
      opponent: m.opponent,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      venue: m.venue,
      location: m.location,
      competition: m.competition,
      homeScore: m.homeScore?.toString() ?? '',
      awayScore: m.awayScore?.toString() ?? '',
      status: m.status,
    })
    setOpen(true)
  }
  const save = async () => {
    setSaving(true)
    const r = await officeItem(edit ? 'update' : 'create', 'matches', {
      id: edit?.id,
      data: { ...form, date: form.date ? `${form.date}T${form.time || '16:00'}:00` : '' },
    })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث المباراة ✅' : 'تمت إضافة المباراة ✅' })
    setOpen(false)
    reload()
  }
  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', 'matches', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف المباراة' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <ManagerHeader title="إدارة المباريات" desc="جدول مباريات الفرع القادمة ونتائجها" onAdd={startCreate} addLabel="مباراة جديدة" />
      <div className="space-y-2.5 max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {data.matches.map((m) => (
          <div key={m.id} className="relative group">
            <MatchRow m={m} />
            <div className="absolute top-1.5 left-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-7 w-7 bg-white/80" onClick={() => startEdit(m)} aria-label="تعديل"><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive bg-white/80" onClick={() => setDel(m)} aria-label="حذف"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {data.matches.length === 0 && <EmptyState icon={CalendarDays} text="لا توجد مباريات مسجلة" />}
      </div>

      <ItemDialog open={open} onClose={() => setOpen(false)} title={edit ? 'تعديل المباراة' : 'إضافة مباراة'}>
        <div className="space-y-3">
          <Field label="الفريق المنافس *">
            <Input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="اسم الفريق الخصم" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="التاريخ *">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} dir="ltr" className="text-right" />
            </Field>
            <Field label="التوقيت">
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} dir="ltr" className="text-right" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="أرضية المباراة">
              <Select value={form.venue} onValueChange={(v) => setForm({ ...form, venue: v })} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">على أرضنا</SelectItem>
                  <SelectItem value="away">خارج أرضنا</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="الحالة">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">قادمة</SelectItem>
                  <SelectItem value="finished">انتهت</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="الملعب / المكان">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="الملعب البلدي بسعيدة" />
          </Field>
          <Field label="البطولة">
            <Input value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} placeholder="البطولة الولائية - الجولة 9" />
          </Field>
          {form.status === 'finished' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="أهداف الرائد">
                <Input type="number" min={0} value={form.homeScore} onChange={(e) => setForm({ ...form, homeScore: e.target.value })} dir="ltr" className="text-right" />
              </Field>
              <Field label="أهداف الخصم">
                <Input type="number" min={0} value={form.awayScore} onChange={(e) => setForm({ ...form, awayScore: e.target.value })} dir="ltr" className="text-right" />
              </Field>
            </div>
          )}
          <SaveButton saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إضافة المباراة'} />
        </div>
      </ItemDialog>
      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.opponent} />
    </div>
  )
}

// ==================== الجدول التدريبي ====================
export function TrainingsManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<TrainingItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<TrainingItem | null>(null)
  const empty = { day: 'السبت', time: '', location: '', coach: '', groupName: '' }
  const [form, setForm] = useState(empty)

  const startCreate = () => {
    setEdit(null)
    setForm(empty)
    setOpen(true)
  }
  const startEdit = (t: TrainingItem) => {
    setEdit(t)
    setForm({ day: t.day, time: t.time, location: t.location, coach: t.coach, groupName: t.groupName })
    setOpen(true)
  }
  const save = async () => {
    setSaving(true)
    const r = await officeItem(edit ? 'update' : 'create', 'trainings', { id: edit?.id, data: form })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث الحصة ✅' : 'تمت إضافة الحصة ✅' })
    setOpen(false)
    reload()
  }
  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', 'trainings', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف الحصة' })
    setDel(null)
    reload()
  }

  return (
    <div>
      <ManagerHeader title="الجدول التدريبي" desc="حصص التدريب الأسبوعية لجميع الفئات" onAdd={startCreate} addLabel="حصة جديدة" />
      <div className="space-y-2.5 max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {data.trainings.map((t) => (
          <div key={t.id} className="rounded-xl border border-(--border) bg-white px-4 py-3 flex flex-wrap items-center gap-2 relative group">
            <Badge style={{ backgroundColor: data.branch.color }} className="text-white">{t.day}</Badge>
            <span className="font-bold text-sm">{t.time}</span>
            {t.groupName && <Badge variant="secondary">{t.groupName}</Badge>}
            {t.location && <span className="text-xs text-muted-foreground"><MapPin className="inline h-3 w-3 ml-1" />{t.location}</span>}
            {t.coach && <span className="text-xs text-muted-foreground mr-auto">{t.coach}</span>}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 left-1 bg-white/80 rounded-lg">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)} aria-label="تعديل"><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDel(t)} aria-label="حذف"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {data.trainings.length === 0 && <EmptyState icon={CalendarClock} text="لم يُضف جدول تدريبي بعد" />}
      </div>

      <ItemDialog open={open} onClose={() => setOpen(false)} title={edit ? 'تعديل الحصة' : 'إضافة حصة تدريبية'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="اليوم *">
              <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="التوقيت *">
              <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="16:00 - 18:00" dir="ltr" className="text-right" />
            </Field>
          </div>
          <Field label="الفئة / المجموعة">
            <Input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} placeholder="الناشئين، الكبار..." />
          </Field>
          <Field label="المكان">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="القاعة المتعددة" />
          </Field>
          <Field label="المدرب المسؤول">
            <Input value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} placeholder="المدرب ..." />
          </Field>
          <SaveButton saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إضافة الحصة'} />
        </div>
      </ItemDialog>
      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.day} />
    </div>
  )
}

// ==================== طلبات الانضمام ====================
export function EnrollmentsManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [del, setDel] = useState<(typeof data.enrollments)[number] | null>(null)

  const setStatus = async (id: string, status: 'accepted' | 'rejected') => {
    setBusy(id)
    const res = await apiFetch('/api/office/enrollments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setBusy(null)
    if (!res.ok) return toast({ title: 'تعذر تحديث الطلب', variant: 'destructive' })
    toast({ title: status === 'accepted' ? 'تم قبول الطلب ✅' : 'تم رفض الطلب' })
    reload()
  }

  const remove = async () => {
    if (!del) return
    setBusy(del.id)
    const res = await apiFetch('/api/office/enrollments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: del.id }),
    })
    setBusy(null)
    if (!res.ok) return toast({ title: 'تعذر حذف الطلب', variant: 'destructive' })
    toast({ title: 'تم حذف الطلب' })
    setDel(null)
    reload()
  }

  const pending = data.enrollments.filter((e) => e.status === 'pending')
  const others = data.enrollments.filter((e) => e.status !== 'pending')

  const Card = ({ e }: { e: (typeof data.enrollments)[number] }) => {
    // صيغة التاريخ الموحدة: يوم/شهر/سنة
    const bdDisplay = formatDateDMY(e.birthDate)
    const isMinor = !!e.parentName
    return (
    <div className="rounded-xl border border-(--border) bg-white p-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold flex items-center gap-2 flex-wrap">
            <User className="h-4 w-4 text-primary shrink-0" />
            {e.fullName || `${e.firstName} ${e.lastName}`}
            {e.gender === 'male' && <Badge variant="secondary" className="text-[10px]">ذكر</Badge>}
            {e.gender === 'female' && <Badge variant="secondary" className="text-[10px]">أنثى</Badge>}
            {isMinor && <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">قاصر</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {bdDisplay && <span><CalendarDays className="inline h-3 w-3 ml-1" />{bdDisplay}</span>}
            <span><strong>العمر:</strong> {e.age} سنة</span>
            <span dir="ltr"><Phone className="inline h-3 w-3 ml-1" />{e.phone}</span>
            <span>{formatDate(e.createdAt)}</span>
          </div>
          {e.address && (
            <div className="text-xs text-muted-foreground mt-1.5">
              <strong>{isMinor ? 'عنوان ولي الأمر:' : 'العنوان:'}</strong> {e.address}
            </div>
          )}
          {isMinor && (
            <div className="text-xs mt-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-900">
              <div><strong>ولي الأمر:</strong> {e.parentName}</div>
              <div><strong>هاتف ولي الأمر:</strong> <span dir="ltr">{e.phone}</span></div>
            </div>
          )}
          {e.note && <p className="text-xs text-muted-foreground mt-2 bg-(--club-light) rounded-lg px-3 py-2">{e.note}</p>}
        </div>
        {e.status === 'pending' ? (
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button size="sm" disabled={busy === e.id} onClick={() => setStatus(e.id, 'accepted')} className="bg-green-600 hover:bg-green-700 text-white">
              <Check className="ml-1 h-4 w-4" /> قبول
            </Button>
            <Button size="sm" disabled={busy === e.id} onClick={() => setStatus(e.id, 'rejected')} variant="outline" className="text-destructive border-destructive/40">
              <X className="ml-1 h-4 w-4" /> رفض
            </Button>
            <Button size="sm" variant="ghost" disabled={busy === e.id} onClick={() => setDel(e)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="ml-1 h-4 w-4" /> حذف
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className={e.status === 'accepted' ? 'bg-green-600 text-white' : 'bg-red-100 text-red-700 border border-red-200'}>
              {e.status === 'accepted' ? 'مقبول' : 'مرفوض'}
            </Badge>
            <Button size="sm" variant="ghost" disabled={busy === e.id} onClick={() => setDel(e)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="ml-1 h-4 w-4" /> حذف
            </Button>
          </div>
        )}
      </div>
    </div>
    )
  }

  return (
    <div>
      <ManagerHeader title="طلبات الانضمام" desc="طلبات الانخراط الواردة من الموقع — راجعها واقبل أو ارفض أو احذف عند الخطأ" />
      <div className="space-y-3 max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {pending.length > 0 && (
          <>
            <h4 className="font-black text-sm text-(--silver) flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> بانتظار المراجعة ({pending.length})
            </h4>
            {pending.map((e) => <Card key={e.id} e={e} />)}
          </>
        )}
        {others.length > 0 && (
          <>
            <h4 className="font-black text-sm text-muted-foreground mt-4">الطلبات المعالجة</h4>
            {others.map((e) => <Card key={e.id} e={e} />)}
          </>
        )}
        {data.enrollments.length === 0 && <EmptyState icon={Inbox} text="لا توجد طلبات انضمام بعد" />}
      </div>

      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del ? `${del.firstName} ${del.lastName}`.trim() || del.fullName : undefined} />
    </div>
  )
}

// ==================== معرض الصور ====================
export function GalleryManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<GalleryImage | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<GalleryImage | null>(null)
  const [form, setForm] = useState({ url: '', caption: '' })

  const startCreate = () => {
    setEdit(null)
    setForm({ url: '', caption: '' })
    setOpen(true)
  }
  const startEdit = (g: GalleryImage) => {
    setEdit(g)
    setForm({ url: g.url, caption: g.caption })
    setOpen(true)
  }
  const save = async () => {
    setSaving(true)
    const r = await officeItem(edit ? 'update' : 'create', 'gallery', edit ? { id: edit.id, data: form } : { data: form })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث الصورة ✅' : 'تمت إضافة الصورة ✅' })
    setOpen(false)
    setEdit(null)
    setForm({ url: '', caption: '' })
    reload()
  }
  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', 'gallery', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف الصورة' })
    setDel(null)
    reload()
  }

  const quick = [
    '/images/branches/football.jpg',
    '/images/branches/basketball.jpg',
    '/images/branches/handball.jpg',
    '/images/branches/volleyball.jpg',
    '/images/branches/athletics.jpg',
    '/images/branches/martial-arts.jpg',
    '/images/branches/swimming.jpg',
    '/images/branches/table-tennis.jpg',
    '/images/gallery/trophy.jpg',
    '/images/gallery/fans.jpg',
    '/images/gallery/youth.jpg',
    '/images/gallery/team.jpg',
    '/images/gallery/training.jpg',
  ]

  return (
    <div>
      <ManagerHeader title="معرض صور الفرع" desc="أضف صوراً من تدريبات ومباريات الفرع — مع تعديل الوصف والحذف" onAdd={startCreate} addLabel="إضافة صورة" />
      <div className="max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {data.gallery.length > 0 ? (
          <div className="relative">
            <GalleryGrid items={data.gallery} />
            <div className="absolute inset-0 pointer-events-none" />
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
              {data.gallery.map((g) => (
                <div key={g.id} className="flex items-center gap-2 rounded-lg bg-white border border-(--border) px-3 py-2">
                  <span className="text-xs truncate flex-1">{g.caption || g.url}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => startEdit(g)} aria-label="تعديل">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => setDel(g)} aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={ImageIcon} text="لا توجد صور بعد" />
        )}
      </div>

      <ItemDialog open={open} onClose={() => setOpen(false)} title={edit ? 'تعديل الصورة' : 'إضافة صورة للمعرض'}>
        <div className="space-y-3">
          <Field label="رابط الصورة *">
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} dir="ltr" placeholder="/images/... أو https://..." />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setForm({ ...form, url: q })}
                className="rounded-lg overflow-hidden h-12 w-16 border-2 hover:border-(--silver) transition-colors"
                aria-label="اختيار صورة جاهزة"
              >
                { }
                <img src={q} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <Field label="وصف الصورة">
            <Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="من حصص تدريب الفريق..." />
          </Field>
          <SaveButton saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إضافة الصورة'} />
        </div>
      </ItemDialog>
      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.caption} />
    </div>
  )
}

// ==================== جدول الترتيب ====================
const emptyStanding = { teamName: '', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }

export function StandingsManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<StandingItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<StandingItem | null>(null)
  const [form, setForm] = useState({ ...emptyStanding })

  const computedPoints = form.won * 3 + form.drawn

  const startCreate = () => {
    setEdit(null)
    setForm({ ...emptyStanding })
    setOpen(true)
  }
  const startEdit = (s: StandingItem) => {
    setEdit(s)
    setForm({
      teamName: s.teamName,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
    })
    setOpen(true)
  }
  const save = async () => {
    setSaving(true)
    const payload = { ...form, points: computedPoints }
    const r = await officeItem(edit ? 'update' : 'create', 'standing', edit ? { id: edit.id, data: payload } : { data: payload })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث الترتيب ✅' : 'تمت إضافة الفريق للترتيب ✅' })
    setOpen(false)
    reload()
  }
  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', 'standing', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف الفريق من الترتيب' })
    setDel(null)
    reload()
  }

  const numField = (label: string, key: keyof typeof emptyStanding) => (
    <Field label={label}>
      <Input
        type="number"
        min={0}
        max={999}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: Math.max(0, parseInt(e.target.value) || 0) })}
      />
    </Field>
  )

  return (
    <div>
      <ManagerHeader title="جدول الترتيب" desc="حدّث ترتيب فريقك في البطولة — يظهر مباشرة في صفحة الفرع" onAdd={startCreate} addLabel="إضافة فريق" />
      <div className="max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {data.standings.length > 0 ? (
          <div className="rounded-2xl border border-(--border) bg-white overflow-hidden">
            <div className="overflow-x-auto nice-scroll">
            <div className="min-w-[560px]">
            <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2rem_2rem_2.5rem_4.5rem] items-center gap-1 bg-(--club-dark) text-white text-[11px] font-bold px-3 py-2.5">
              <span>#</span>
              <span className="text-right">الفريق</span>
              <span className="text-center">لعب</span>
              <span className="text-center">ف</span>
              <span className="text-center">ت</span>
              <span className="text-center">خ</span>
              <span className="text-center">له</span>
              <span className="text-center">عليه</span>
              <span className="text-center text-(--silver)">نقاط</span>
              <span className="text-center">إجراءات</span>
            </div>
            {data.standings.map((s, i) => (
              <div
                key={s.id}
                className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2rem_2rem_2.5rem_4.5rem] items-center gap-1 px-3 py-2 text-xs border-t border-(--border) hover:bg-primary/5"
              >
                <span className={`font-black ${i === 0 ? 'text-(--silver)' : 'text-muted-foreground'}`}>{i + 1}</span>
                <span className="font-bold text-(--club-dark) truncate text-right">{s.teamName}</span>
                <span className="text-center">{s.played}</span>
                <span className="text-center text-green-700 font-bold">{s.won}</span>
                <span className="text-center">{s.drawn}</span>
                <span className="text-center text-destructive">{s.lost}</span>
                <span className="text-center">{s.goalsFor}</span>
                <span className="text-center">{s.goalsAgainst}</span>
                <span className="text-center font-black text-primary">{s.points}</span>
                <span className="flex items-center justify-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(s)} aria-label="تعديل">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDel(s)} aria-label="حذف">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </span>
              </div>
            ))}
            </div>
            </div>
          </div>
        ) : (
          <EmptyState icon={ListOrdered} text="لا يوجد ترتيب بعد — أضف فريقاً لتبدأ البطولة" />
        )}
      </div>

      <ItemDialog open={open} onClose={() => setOpen(false)} title={edit ? 'تعديل بيانات الفريق' : 'إضافة فريق إلى الترتيب'}>
        <div className="space-y-3">
          <Field label="اسم الفريق *">
            <Input value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} placeholder="الرائد سعيدة" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            {numField('لعب', 'played')}
            {numField('فوز', 'won')}
            {numField('تعادل', 'drawn')}
            {numField('خسارة', 'lost')}
            {numField('له', 'goalsFor')}
            {numField('عليه', 'goalsAgainst')}
          </div>
          <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-bold text-(--club-dark) flex items-center justify-between">
            <span>النقاط (تُحسب تلقائياً)</span>
            <span className="text-(--silver) text-lg font-black">{computedPoints}</span>
          </div>
          <SaveButton saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إضافة الفريق'} />
        </div>
      </ItemDialog>
      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.teamName} />
    </div>
  )
}

// ==================== فيديوهات الفرع ====================
export function VideosManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<VideoItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState<VideoItem | null>(null)
  const [form, setForm] = useState({ title: '', url: '', thumb: '' })

  const startCreate = () => {
    setEdit(null)
    setForm({ title: '', url: '', thumb: '' })
    setOpen(true)
  }
  const startEdit = (v: VideoItem) => {
    setEdit(v)
    setForm({ title: v.title, url: v.url, thumb: v.thumb })
    setOpen(true)
  }
  const save = async () => {
    setSaving(true)
    const r = await officeItem(edit ? 'update' : 'create', 'video', edit ? { id: edit.id, data: form } : { data: form })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: edit ? 'تم تحديث الفيديو ✅' : 'تمت إضافة الفيديو ✅' })
    setOpen(false)
    reload()
  }
  const remove = async () => {
    if (!del) return
    const r = await officeItem('delete', 'video', { id: del.id })
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم حذف الفيديو' })
    setDel(null)
    reload()
  }

  const quickThumbs = [
    '/images/hero.jpg',
    '/images/gallery/training.jpg',
    '/images/gallery/team.jpg',
    '/images/gallery/fans.jpg',
    '/images/gallery/trophy.jpg',
    '/images/gallery/youth.jpg',
  ]

  return (
    <div>
      <ManagerHeader title="فيديوهات الفرع" desc="أضف فيديوهات mp4 محلية أو روابط يوتيوب — تظهر في صفحة الفرع والمعرض" onAdd={startCreate} addLabel="إضافة فيديو" />
      <div className="max-h-[62vh] overflow-y-auto nice-scroll pl-1">
        {data.videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.videos.map((v) => (
              <div key={v.id} className="rounded-2xl overflow-hidden border border-(--border) bg-white group">
                <div className="relative aspect-video bg-(--club-dark)">
                  {v.thumb ? (
                    <img src={v.thumb} alt={v.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full club-gradient" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="h-10 w-10 rounded-full bg-(--silver) text-(--club-dark) flex items-center justify-center shadow-lg">
                      <PlayCircle className="h-5 w-5" />
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold text-(--club-dark) truncate">{v.title}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground truncate flex-1" dir="ltr">{v.url}</span>
                    <span className="flex items-center gap-0.5 shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(v)} aria-label="تعديل">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDel(v)} aria-label="حذف">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Clapperboard} text="لا توجد فيديوهات بعد" />
        )}
      </div>

      <ItemDialog open={open} onClose={() => setOpen(false)} title={edit ? 'تعديل الفيديو' : 'إضافة فيديو'}>
        <div className="space-y-3">
          <Field label="عنوان الفيديو *">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="أجواء المباراة الأخيرة" />
          </Field>
          <Field label="رابط الفيديو * (mp4 أو يوتيوب)">
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} dir="ltr" placeholder="https://www.youtube.com/watch?v=... أو /videos/..." />
          </Field>
          <Field label="صورة مصغرة (اختياري)">
            <Input value={form.thumb} onChange={(e) => setForm({ ...form, thumb: e.target.value })} dir="ltr" placeholder="/images/..." />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {quickThumbs.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setForm({ ...form, thumb: q })}
                className="rounded-lg overflow-hidden h-12 w-16 border-2 hover:border-(--silver) transition-colors"
                aria-label="اختيار صورة مصغرة جاهزة"
              >
                <img src={q} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <SaveButton saving={saving} onClick={save} label={edit ? 'حفظ التعديلات' : 'إضافة الفيديو'} />
        </div>
      </ItemDialog>
      <ConfirmDelete open={!!del} onClose={() => setDel(null)} onConfirm={remove} name={del?.title} />
    </div>
  )
}

// ==================== إعدادات الفرع ====================
export function SettingsManager({ data, reload }: Office) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [motto, setMotto] = useState(data.branch.motto)
  const [description, setDescription] = useState(data.branch.description)

  const save = async () => {
    setSaving(true)
    const r = await officeItem('update', 'settings', { data: { motto, description } })
    setSaving(false)
    if (!r.ok) return toast({ title: r.error || 'خطأ', variant: 'destructive' })
    toast({ title: 'تم تحديث معلومات الفرع ✅' })
    reload()
  }

  return (
    <div className="max-w-2xl">
      <ManagerHeader title="إعدادات الفرع" desc="حدّث شعار الفرع ووصفه الظاهر في الموقع" />
      <div className="space-y-4 rounded-2xl border border-(--border) bg-white p-6">
        <Field label="شعار الفرع (الموتّو)">
          <Input value={motto} onChange={(e) => setMotto(e.target.value)} placeholder="قلب النادي النابض" />
        </Field>
        <Field label="وصف الفرع *">
          <Textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="نبذة عن الفرع وتاريخه وبرامجه..." />
        </Field>
        <SaveButton saving={saving} onClick={save} label="حفظ الإعدادات" />
      </div>
      <div className="mt-5">
        <OfficePasswordCard />
      </div>
    </div>
  )
}

/** بطاقة تغيير كلمة مرور حساب المكتب — الإبطال فوري لكل الجلسات القديمة */
function OfficePasswordCard() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const change = async () => {
    if (!current || !next) return
    if (next !== confirm) return toast({ title: 'كلمة المرور الجديدة والتأكيد غير متطابقين', variant: 'destructive' })
    setSaving(true)
    try {
      const res = await apiFetch('/api/office/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'فشل تغيير كلمة المرور')
      toast({ title: 'تم تغيير كلمة المرور بنجاح — احتفظ بها في مكان آمن' })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-(--border) bg-white p-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="h-5 w-5 text-primary" />
        <h4 className="font-black text-(--club-dark)">أمان الحساب — تغيير كلمة المرور</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4">8 أحرف على الأقل (حرف إنجليزي + رقم). عند التغيير تُبطل كل الجلسات القديمة فوراً.</p>
      <div className="space-y-3">
        <Field label="كلمة المرور الحالية">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="كلمة المرور الجديدة">
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="تأكيد كلمة المرور الجديدة">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        <SaveButton saving={saving} onClick={change} label="تغيير كلمة المرور" />
      </div>
    </div>
  )
}

// ==================== عناصر مساعدة ====================
export function ManagerHeader({ title, desc, onAdd, addLabel }: { title: string; desc: string; onAdd?: () => void; addLabel?: string }) {
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

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function ItemDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto nice-scroll">
        <DialogHeader>
          <DialogTitle className="font-black text-(--club-dark)">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function SaveButton({ saving, onClick, label }: { saving: boolean; onClick: () => void; label: string }) {
  return (
    <Button onClick={onClick} disabled={saving} className="w-full h-11 font-black bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark)">
      {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      {saving ? 'جارٍ الحفظ...' : label}
    </Button>
  )
}

function ConfirmDelete({ open, onClose, onConfirm, name }: { open: boolean; onClose: () => void; onConfirm: () => void; name?: string }) {
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
