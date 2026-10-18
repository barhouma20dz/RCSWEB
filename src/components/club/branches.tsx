'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Newspaper, CalendarDays, Loader2, X, Clock, MapPin, Medal, LogIn, Trophy } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SettingsSectionHeader, VideoGrid } from './shared'
import { BranchIcon } from './icon-map'
import { useT } from './i18n'
import { formatDateDMY } from '@/lib/date-format'
import type { BranchSummary, BranchDetail, MatchItem, GalleryImage, StandingItem } from './types'

export function MatchRow({ m, showBranch }: { m: MatchItem; showBranch?: boolean }) {
  const isHome = m.venue === 'home'
  const finished = m.status === 'finished'
  return (
    <div className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface) px-4 py-3">
      <div
        className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-black"
        style={{ backgroundColor: m.branch.color }}
      >
        {isHome ? 'د' : 'خ'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">
          {showBranch && <span style={{ color: m.branch.color }}>{m.branch.name} · </span>}
          الرائد × {m.opponent}
          <span className="text-muted-foreground font-semibold"> ({isHome ? 'أرضنا' : 'خارج'})</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {formatDateDMY(m.date)}
          </span>
          {m.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {m.location}
            </span>
          )}
        </div>
      </div>
      {finished ? (
        <Badge className="shrink-0 bg-(--club) text-white text-sm px-3 py-1">
          {m.homeScore ?? '-'} : {m.awayScore ?? '-'}
        </Badge>
      ) : (
        <Badge variant="outline" className="shrink-0 border-(--primary)/40 text-(--primary) text-xs px-3 py-1">
          <Clock className="ml-1 h-3 w-3" />
          قادمة
        </Badge>
      )}
    </div>
  )
}

export function GalleryGrid({ items, onSelect }: { items: GalleryImage[]; onSelect?: (g: GalleryImage) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect?.(g)}
          className="group relative rounded-xl overflow-hidden aspect-video text-right"
          aria-label={g.caption || 'صورة من معرض النادي'}
        >
          <img
            src={g.url}
            alt={g.caption || 'صورة من النادي'}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {g.caption && (
            <div className="absolute bottom-2 right-3 left-3 text-white text-xs font-bold truncate">
              {g.caption}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

/** جدول الترتيب — صف الرائد مميز بخلفية ذهبية وشارة «نادينا» */
export function StandingsTable({ items }: { items: StandingItem[] }) {
  const sorted = [...items].sort((a, b) => b.points - a.points || b.goalsFor - b.goalsFor)
  return (
    <div className="overflow-x-auto rounded-xl border border-(--border) bg-(--surface)">
      <table className="w-full text-sm text-center">
        <thead>
          <tr className="bg-(--club-dark) text-white text-xs">
            <th className="py-2.5 px-2 font-black">#</th>
            <th className="py-2.5 px-2 font-black text-right">الفريق</th>
            <th className="py-2.5 px-2 font-black">لعب</th>
            <th className="py-2.5 px-2 font-black">ف</th>
            <th className="py-2.5 px-2 font-black">ت</th>
            <th className="py-2.5 px-2 font-black">خ</th>
            <th className="py-2.5 px-2 font-black">له</th>
            <th className="py-2.5 px-2 font-black">عليه</th>
            <th className="py-2.5 px-2 font-black text-(--silver)">نقاط</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const isOurClub = s.teamName.includes('الرائد')
            return (
              <tr
                key={s.id}
                className={`border-t border-(--border) ${
                  isOurClub ? 'bg-(--primary)/10 font-black' : i % 2 === 1 ? 'bg-(--chip)/50' : ''
                }`}
              >
                <td className="py-2.5 px-2 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 px-2 text-right">
                  <span className="inline-flex items-center gap-2">
                    {s.teamName}
                    {isOurClub && (
                      <Badge className="bg-(--primary) text-white text-[10px] px-2 py-0">نادينا</Badge>
                    )}
                  </span>
                </td>
                <td className="py-2.5 px-2">{s.played}</td>
                <td className="py-2.5 px-2 text-green-500 light:text-green-700 font-bold">{s.won}</td>
                <td className="py-2.5 px-2">{s.drawn}</td>
                <td className="py-2.5 px-2 text-destructive">{s.lost}</td>
                <td className="py-2.5 px-2">{s.goalsFor}</td>
                <td className="py-2.5 px-2">{s.goalsAgainst}</td>
                <td className="py-2.5 px-2 font-black text-(--primary) text-base">{s.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BranchDialog({
  slug,
  open,
  onClose,
  onOfficeLogin,
}: {
  slug: string
  open: boolean
  onClose: () => void
  onOfficeLogin?: () => void
}) {
  const [detail, setDetail] = useState<BranchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const standings = detail?.standings ?? []
  const videos = detail?.videos ?? []

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/public/branch?slug=${encodeURIComponent(slug)}`)
        const d = await res.json()
        if (!cancelled) setDetail(d.branch ?? null)
      } catch {
        if (!cancelled) setDetail(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-4xl max-h-[88vh] overflow-y-auto nice-scroll p-0 gap-0"
      >
        <DialogTitle className="sr-only">تفاصيل الفرع الرياضي</DialogTitle>
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {detail && (
          <div>
            {/* رأس الفرع */}
            <div className="relative h-44 md:h-52">
              { }
              <img src={detail.image} alt={`فرع ${detail.name}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/20" />
              <button
                onClick={onClose}
                className="absolute top-3 left-3 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 right-5 flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: detail.color }}
                >
                  <BranchIcon name={detail.icon} className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">فرع {detail.name}</p>
                  <p className="text-(--silver) font-bold text-sm mt-0.5">{detail.motto}</p>
                </div>
              </div>
              {onOfficeLogin && (
                <button
                  onClick={onOfficeLogin}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-(--silver) hover:text-(--club-dark) text-white text-xs font-black px-3 py-2 backdrop-blur transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  دخول مكتب هذا الفرع
                </button>
              )}
            </div>

            <div className="p-4 md:p-6">
              <Tabs defaultValue="overview" dir="rtl">
                <TabsList className="w-full flex-wrap h-auto gap-1 bg-(--chip) p-1.5 rounded-xl">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">نظرة عامة</TabsTrigger>
                  <TabsTrigger value="players" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">اللاعبون ({detail.players.length})</TabsTrigger>
                  <TabsTrigger value="matches" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">المباريات</TabsTrigger>
                  <TabsTrigger value="trainings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">التدريبات</TabsTrigger>
                  <TabsTrigger value="news" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">الأخبار</TabsTrigger>
                  <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">الصور</TabsTrigger>
                  {standings.length > 0 && (
                    <TabsTrigger value="standings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">
                      جدول الترتيب
                    </TabsTrigger>
                  )}
                  {videos.length > 0 && (
                    <TabsTrigger value="videos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-(--club-dark)">
                      الفيديوهات
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <p className="leading-loose text-foreground/85 text-sm md:text-base">{detail.description}</p>
                  {detail.achievements.length > 0 && (
                    <div>
                      <h4 className="font-black text-(--ink) mb-3 flex items-center gap-2">
                        <Medal className="h-4 w-4 text-(--primary)" /> إنجازات الفرع
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {detail.achievements.map((a) => (
                          <div key={a.id} className="rounded-xl bg-(--chip) p-3 border-r-4" style={{ borderColor: detail.color }}>
                            <div className="font-bold text-sm">{a.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">{a.year}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="players" className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto nice-scroll pl-1">
                    {detail.players.map((p) => (
                      <div key={p.id} className="rounded-xl border border-(--border) bg-(--surface) p-3 text-center">
                        <div
                          className="mx-auto mb-2 h-12 w-12 rounded-full flex items-center justify-center text-white font-black text-lg"
                          style={{ backgroundColor: detail.color }}
                        >
                          {p.number ?? p.name.charAt(0)}
                        </div>
                        <div className="font-bold text-sm truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.position}</div>
                        {p.age && <div className="text-xs text-muted-foreground font-bold mt-0.5">{p.age} سنة</div>}
                      </div>
                    ))}
                    {detail.players.length === 0 && (
                      <p className="col-span-full text-center text-muted-foreground py-8 text-sm">لا يوجد لاعبون مسجلون بعد</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="matches" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-black text-(--ink) mb-2">المباريات القادمة</h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto nice-scroll">
                      {detail.upcoming.map((m) => (
                        <MatchRow key={m.id} m={m} />
                      ))}
                      {detail.upcoming.length === 0 && (
                        <p className="text-center text-muted-foreground py-4 text-sm">لا توجد مباريات قادمة</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-(--ink) mb-2">آخر النتائج</h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto nice-scroll">
                      {detail.results.map((m) => (
                        <MatchRow key={m.id} m={m} />
                      ))}
                      {detail.results.length === 0 && (
                        <p className="text-center text-muted-foreground py-4 text-sm">لا توجد نتائج مسجلة</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trainings" className="mt-4">
                  <div className="space-y-2 max-h-96 overflow-y-auto nice-scroll">
                    {detail.trainings.map((t) => (
                      <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-4 py-3">
                        <Badge style={{ backgroundColor: detail.color }} className="text-white">
                          {t.day}
                        </Badge>
                        <span className="font-bold text-sm">{t.time}</span>
                        {t.groupName && <Badge variant="secondary">{t.groupName}</Badge>}
                        {t.location && <span className="text-xs text-muted-foreground"><MapPin className="inline h-3 w-3 ml-1" />{t.location}</span>}
                        {t.coach && <span className="text-xs text-muted-foreground mr-auto">{t.coach}</span>}
                      </div>
                    ))}
                    {detail.trainings.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">لم يُنشر جدول تدريبي بعد</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="news" className="mt-4 space-y-3 max-h-96 overflow-y-auto nice-scroll">
                  {detail.news.map((n) => (
                    <div key={n.id} className="rounded-xl border border-(--border) overflow-hidden bg-(--surface)">
                      {n.image && (
                         
                        <img src={n.image} alt={n.title} className="h-36 w-full object-cover" />
                      )}
                      <div className="p-3">
                        <div className="font-bold text-sm">{n.title}</div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                        <div className="text-[10px] text-muted-foreground font-bold mt-1.5">{formatDateDMY(n.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                  {detail.news.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">لا توجد أخبار بعد</p>
                  )}
                </TabsContent>

                <TabsContent value="media" className="mt-4 max-h-96 overflow-y-auto nice-scroll">
                  {detail.gallery.length > 0 ? (
                    <GalleryGrid items={detail.gallery} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">لا توجد صور بعد</p>
                  )}
                </TabsContent>

                {standings.length > 0 && (
                  <TabsContent value="standings" className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-4 w-4 text-(--flag-red)" />
                      <h4 className="font-black text-(--ink)">جدول الترتيب</h4>
                    </div>
                    <div className="max-h-96 overflow-y-auto nice-scroll">
                      <StandingsTable items={standings} />
                    </div>
                  </TabsContent>
                )}

                {videos.length > 0 && (
                  <TabsContent value="videos" className="mt-4 max-h-96 overflow-y-auto nice-scroll">
                    <VideoGrid items={videos} />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function Branches({
  branches,
  onOfficeLogin,
}: {
  branches: BranchSummary[]
  onOfficeLogin?: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const t = useT()

  return (
    <section id="branches" className="py-16 md:py-24 club-gradient relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="branches"
          eyebrowKey="branches.eyebrow"
          titleKey="branches.title"
          subtitleKey="branches.subtitle"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {branches.map((b, i) => (
            <motion.button
              key={b.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.08, duration: 0.5 }}
              onClick={() => setSelected(b.slug)}
              className="card-hover group relative rounded-2xl overflow-hidden bg-(--surface) shadow-sm text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-(--silver)"
            >
              <div className="relative h-40 overflow-hidden">
                {b.image ? (
                  <img
                    src={b.image}
                    alt={`فرع ${b.name}`}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="h-full w-full group-hover:scale-110 transition-transform duration-500"
                    style={{ background: `linear-gradient(135deg, ${b.color}, #0f1b3a)` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div
                  className="absolute top-3 right-3 h-11 w-11 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: b.color }}
                >
                  <BranchIcon name={b.icon} className="h-6 w-6 text-white" />
                </div>
                <div className="absolute bottom-3 right-4 left-4">
                  <h3 className="text-xl font-black text-white drop-shadow">{b.name}</h3>
                  <p className="text-(--silver) text-xs font-bold">{b.motto}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 min-h-[2.5rem]">
                  {b.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-[11px] font-bold text-muted-foreground">
                    <span className="inline-flex items-center gap-1 bg-(--chip) px-2 py-1 rounded-md">
                      <Users className="h-3 w-3" /> {b._count?.players ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-(--chip) px-2 py-1 rounded-md">
                      <Newspaper className="h-3 w-3" /> {b._count?.news ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-(--chip) px-2 py-1 rounded-md">
                      <CalendarDays className="h-3 w-3" /> {b._count?.matches ?? 0}
                    </span>
                  </div>
                  <span className="text-primary font-bold text-sm">{t('branches.details')} ←</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <BranchDialog
            key={selected}
            slug={selected}
            open
            onClose={() => setSelected(null)}
            onOfficeLogin={onOfficeLogin}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
