'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Newspaper,
  Users,
  CalendarDays,
  CalendarClock,
  Inbox,
  Image as ImageIcon,
  Settings,
  LogOut,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ListOrdered,
  Clapperboard,
  IdCard,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, clearSessionToken } from '@/lib/session'
import { BranchIcon } from '../icon-map'
import {
  NewsManager,
  PlayersManager,
  MatchesManager,
  TrainingsManager,
  EnrollmentsManager,
  GalleryManager,
  StandingsManager,
  VideosManager,
  SettingsManager,
} from './managers'
import { BranchMembersManager, BranchDocumentsManager } from './members-docs'
import type { OfficeAccount, OfficeData } from '../types'

type TabKey =
  | 'overview'
  | 'members'
  | 'documents'
  | 'news'
  | 'players'
  | 'matches'
  | 'standings'
  | 'trainings'
  | 'enrollments'
  | 'gallery'
  | 'videos'
  | 'settings'

const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'overview', label: 'لوحة المعلومات', icon: LayoutDashboard },
  { key: 'members', label: 'أعضاء الفرع', icon: IdCard },
  { key: 'documents', label: 'كتب الإدارة', icon: BookOpen },
  { key: 'news', label: 'الأخبار', icon: Newspaper },
  { key: 'players', label: 'اللاعبون', icon: Users },
  { key: 'matches', label: 'المباريات', icon: CalendarDays },
  { key: 'standings', label: 'جدول الترتيب', icon: ListOrdered },
  { key: 'trainings', label: 'الجدول التدريبي', icon: CalendarClock },
  { key: 'enrollments', label: 'طلبات الانضمام', icon: Inbox },
  { key: 'gallery', label: 'معرض الصور', icon: ImageIcon },
  { key: 'videos', label: 'الفيديوهات', icon: Clapperboard },
  { key: 'settings', label: 'إعدادات الفرع', icon: Settings },
]

export function BranchOffice({
  account,
  onBack,
  onLogout,
}: {
  account: OfficeAccount
  onBack: () => void
  onLogout: () => void
}) {
  const { toast } = useToast()
  const [data, setData] = useState<OfficeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('overview')

  // لوحة المكتب نمط ورقي فاتح دائماً — نفرض رموز الوضع النهاري ما دامت اللوحة مفتوحة
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('panel-light')
    return () => root.classList.remove('panel-light')
  }, [])

  const reload = useCallback(async () => {
    try {
      const res = await apiFetch('/api/office/data')
      if (res.status === 401) {
        toast({ title: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً', variant: 'destructive' })
        onLogout()
        return
      }
      const d = await res.json()
      setData(d)
    } catch {
      toast({ title: 'فشل تحميل بيانات المكتب', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast, onLogout])

  useEffect(() => {
    void reload()
  }, [reload])

  const doLogout = async () => {
    clearSessionToken()
    await apiFetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen club-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-(--silver) mx-auto mb-4" />
          <p className="text-white font-bold">جارٍ فتح مكتب {account.branch.name}...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen club-gradient flex items-center justify-center px-4">
        <div className="text-center text-white">
          <p className="font-bold mb-4">تعذر تحميل بيانات المكتب</p>
          <Button onClick={() => reload()} variant="outline" className="border-white/30 text-white">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  const color = data.branch.color
  // أيقونة الفرع اختيارية في العقد الحالي للجلسة
  const branchIcon = (data.branch as unknown as { icon?: string }).icon || 'Trophy'

  const statCards = [
    { label: 'عضو في الفرع', value: data.stats.membersCount, icon: IdCard },
    { label: 'وثيقة واردة', value: data.stats.documentsCount, icon: BookOpen },
    { label: 'لاعب مسجل', value: data.stats.playersCount, icon: Users },
    { label: 'مباراة قادمة', value: data.stats.upcomingCount, icon: CalendarDays },
    { label: 'طلب انضمام معلق', value: data.stats.pendingEnrollments, icon: Inbox, alert: data.stats.pendingEnrollments > 0 },
    { label: 'حصة تدريبية', value: data.stats.trainingsCount, icon: CalendarClock },
    { label: 'صورة في المعرض', value: data.stats.galleryCount, icon: ImageIcon },
    { label: 'فريق في الترتيب', value: data.stats.standingsCount, icon: ListOrdered },
  ]

  return (
    <div className="min-h-screen bg-(--club-light) flex flex-col">
      {/* رأس المكتب */}
      <header className="club-gradient sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
              <BranchIcon name={branchIcon} className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-white text-sm md:text-base truncate">مكتب فرع {data.branch.name}</div>
              <div className="text-(--silver) text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {account.username}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onBack} variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
              <ArrowRight className="ml-1 h-4 w-4" /> الموقع
            </Button>
            <Button onClick={doLogout} variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
              <LogOut className="ml-1 h-4 w-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* القائمة الجانبية */}
        <aside className="lg:w-60 shrink-0">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0" aria-label="أقسام المكتب">
            {tabs.map((t) => {
              const active = tab === t.key
              const badge =
                t.key === 'enrollments' && data.stats.pendingEnrollments > 0
                  ? data.stats.pendingEnrollments
                  : null
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    active ? 'text-white shadow-md' : 'bg-white text-(--club-dark) hover:bg-white/70 border border-(--border)'
                  }`}
                  style={active ? { backgroundColor: color } : undefined}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {badge && <Badge className="mr-auto bg-(--silver) text-(--club-dark)">{badge}</Badge>}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* المحتوى */}
        <main className="flex-1 min-w-0">
          {tab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {/* ترحيب */}
              <div className="rounded-3xl club-gradient p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-(--silver)/10" />
                <h2 className="text-2xl font-black text-white">أهلاً بك في مكتب {data.branch.name} 👋</h2>
                <p className="text-white/75 mt-2 leading-relaxed max-w-2xl">
                  من هنا تدير كل ما يخص فرعك: الأخبار، اللاعبون، المباريات، الجدول التدريبي، طلبات الانضمام
                  ومعرض الصور — كل تغيير يظهر مباشرة على الموقع.
                </p>
                {data.stats.pendingEnrollments > 0 && (
                  <button
                    onClick={() => setTab('enrollments')}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-(--silver) text-(--club-dark) font-bold px-4 py-2 text-sm hover:bg-(--silver)/85"
                  >
                    <Inbox className="h-4 w-4" />
                    لديك {data.stats.pendingEnrollments} طلب انضمام بانتظار المراجعة
                  </button>
                )}
              </div>

              {/* بطاقات الإحصائيات */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {statCards.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl bg-white p-5 border ${s.alert ? 'border-(--silver) shadow-md' : 'border-(--border)'}`}
                  >
                    <s.icon className={`h-6 w-6 mb-2 ${s.alert ? 'text-(--silver)' : 'text-primary'}`} />
                    <div className="text-3xl font-black text-(--club-dark)">{s.value}</div>
                    <div className="text-xs text-muted-foreground font-bold mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'members' && <BranchMembersManager data={data} reload={reload} />}
          {tab === 'documents' && <BranchDocumentsManager data={data} />}
          {tab === 'news' && <NewsManager data={data} reload={reload} />}
          {tab === 'players' && <PlayersManager data={data} reload={reload} />}
          {tab === 'matches' && <MatchesManager data={data} reload={reload} />}
          {tab === 'standings' && <StandingsManager data={data} reload={reload} />}
          {tab === 'trainings' && <TrainingsManager data={data} reload={reload} />}
          {tab === 'enrollments' && <EnrollmentsManager data={data} reload={reload} />}
          {tab === 'gallery' && <GalleryManager data={data} reload={reload} />}
          {tab === 'videos' && <VideosManager data={data} reload={reload} />}
          {tab === 'settings' && <SettingsManager data={data} reload={reload} />}
        </main>
      </div>
    </div>
  )
}
