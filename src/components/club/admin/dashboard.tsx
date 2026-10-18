'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Newspaper,
  Users,
  CalendarDays,
  Inbox,
  Mail,
  ShoppingBag,
  Building2,
  LogOut,
  ArrowRight,
  Loader2,
  ShieldCheck,
  BookOpen,
  Palette,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, clearSessionToken } from '@/lib/session'
import {
  BranchesManager,
  EnrollmentsManager,
  NewsAdminManager,
  MessagesManager,
  ShopAdminManager,
} from './managers'
import { RecordsManager } from './records'
import { MembersManager } from './members-manager'
import { SiteSettingsManager } from './site-settings'
import { SecurityManager } from './security'
import type { AdminAccount, AdminData } from '../types'

type TabKey =
  | 'overview'
  | 'branches'
  | 'enrollments'
  | 'news'
  | 'messages'
  | 'shop'
  | 'records'
  | 'members'
  | 'siteSettings'
  | 'security'

const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { key: 'branches', label: 'الفروع', icon: Building2 },
  { key: 'records', label: 'كتب النادي', icon: BookOpen },
  { key: 'members', label: 'إطارات الفروع', icon: Users },
  { key: 'enrollments', label: 'طلبات الانضمام', icon: Inbox },
  { key: 'news', label: 'الأخبار', icon: Newspaper },
  { key: 'messages', label: 'الرسائل', icon: Mail },
  { key: 'shop', label: 'المتجر', icon: ShoppingBag },
  { key: 'siteSettings', label: 'إعدادات الموقع', icon: Palette },
  { key: 'security', label: 'الأمان والحسابات', icon: Shield },
]

export function AdminDashboard({
  admin,
  onBack,
  onLogout,
}: {
  admin: AdminAccount
  onBack: () => void
  onLogout: () => void
}) {
  const { toast } = useToast()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('overview')

  // لوحة الإدارة نمط ورقي فاتح دائماً — نفرض رموز الوضع النهاري ما دامت اللوحة مفتوحة
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('panel-light')
    return () => root.classList.remove('panel-light')
  }, [])

  const reload = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/data')
      if (res.status === 401) {
        toast({ title: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً', variant: 'destructive' })
        onLogout()
        return
      }
      const d = await res.json()
      setData(d)
    } catch {
      toast({ title: 'فشل تحميل بيانات الإدارة', variant: 'destructive' })
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
          <p className="text-white font-bold">جارٍ فتح لوحة الإدارة...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen club-gradient flex items-center justify-center px-4">
        <div className="text-center text-white">
          <p className="font-bold mb-4">تعذر تحميل بيانات الإدارة</p>
          <Button onClick={() => reload()} variant="outline" className="border-white/30 text-white">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'فرع رياضي', value: data.stats.branchesCount, icon: Building2 },
    { label: 'إطار معيّن', value: data.stats.membersCount, icon: Users },
    { label: 'وثيقة في كتب النادي', value: data.stats.documentsCount, icon: BookOpen },
    { label: 'لاعب مسجل', value: data.stats.playersCount, icon: Users },
    { label: 'طلب انضمام معلق', value: data.stats.pendingEnrollments, icon: Inbox, alert: data.stats.pendingEnrollments > 0 },
    { label: 'رسالة تواصل', value: data.stats.messagesCount, icon: Mail },
    { label: 'طلب متجر معلق', value: data.stats.pendingOrders, icon: ShoppingBag, alert: data.stats.pendingOrders > 0 },
  ]

  const tabBadges: Partial<Record<TabKey, number>> = {
    enrollments: data.stats.pendingEnrollments,
    shop: data.stats.pendingOrders,
  }

  return (
    <div className="min-h-screen bg-(--club-light) flex flex-col">
      {/* رأس الإدارة */}
      <header className="club-gradient sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/images/logo.png"
              alt="شعار النادي الرياضي الرائد"
              className="h-11 w-11 rounded-xl object-contain ring-2 ring-(--silver)/70 shrink-0"
            />
            <div className="min-w-0">
              <div className="font-black text-white text-sm md:text-base truncate">الإدارة العامة — النادي الرياضي الرائد</div>
              <div className="text-(--silver) text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {admin.name || admin.username}
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
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0" aria-label="أقسام الإدارة">
            {tabs.map((t) => {
              const active = tab === t.key
              const badge = tabBadges[t.key]
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-(--silver) text-(--club-dark) shadow-md'
                      : 'bg-white text-(--club-dark) hover:bg-white/70 border border-(--border)'
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {badge != null && badge > 0 && <Badge className="mr-auto bg-(--club) text-white">{badge}</Badge>}
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
                <h2 className="text-2xl font-black text-white">أهلاً بك في الإدارة العامة</h2>
                <p className="text-white/75 mt-2 leading-relaxed max-w-2xl">
                  من هنا تدير النادي بالكامل: الفروع وحسابات المكاتب، طلبات الانضمام، الأخبار، رسائل التواصل
                  ومتجر النادي — كل تغيير يظهر مباشرة على الموقع.
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
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
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

          {tab === 'branches' && <BranchesManager data={data} reload={reload} />}
          {tab === 'records' && <RecordsManager data={data} reload={reload} />}
          {tab === 'members' && <MembersManager data={data} reload={reload} />}
          {tab === 'siteSettings' && <SiteSettingsManager data={data} reload={reload} />}
          {tab === 'enrollments' && <EnrollmentsManager data={data} reload={reload} />}
          {tab === 'news' && <NewsAdminManager data={data} reload={reload} />}
          {tab === 'messages' && <MessagesManager data={data} reload={reload} />}
          {tab === 'shop' && <ShopAdminManager data={data} reload={reload} />}
          {tab === 'security' && <SecurityManager />}
        </main>
      </div>
    </div>
  )
}
