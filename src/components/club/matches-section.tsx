'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Trophy } from 'lucide-react'
import { SettingsSectionHeader } from './shared'
import { MatchRow } from './branches'
import { useT } from './i18n'
import { formatDateDMY } from '@/lib/date-format'
import type { MatchItem } from './types'

function useCountdown(target?: string) {
  const [remaining, setRemaining] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  useEffect(() => {
    if (!target) return
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining(null)
        return
      }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return remaining
}

function Countdown({ target }: { target: string }) {
  const r = useCountdown(target)
  if (!r) return null
  const cells = [
    { v: r.d, l: 'يوم' },
    { v: r.h, l: 'ساعة' },
    { v: r.m, l: 'دقيقة' },
    { v: r.s, l: 'ثانية' },
  ]
  return (
    <div className="flex gap-2 md:gap-3" dir="ltr">
      {cells.map((c) => (
        <div
          key={c.l}
          className="w-16 md:w-20 rounded-2xl bg-paper/10 border border-paper/25 backdrop-blur px-2 py-3 text-center"
        >
          <div className="text-2xl md:text-3xl font-black text-paper tabular-nums">
            {String(c.v).padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs text-(--silver) light:text-(--accent-deep2, var(--club)) font-bold mt-0.5">{c.l}</div>
        </div>
      ))}
    </div>
  )
}

export function MatchesSection({ upcoming, results }: { upcoming: MatchItem[]; results: MatchItem[] }) {
  const next = upcoming[0]
  const rest = upcoming.slice(1)
  const t = useT()

  return (
    <section id="matches" className="py-16 md:py-24 club-gradient relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="matches"
          eyebrowKey="matches.eyebrow"
          titleKey="matches.title"
          subtitleKey="matches.subtitle"
        />

        {/* مباراة الأسبوع */}
        {next && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-black/25 light:bg-black/10 border border-paper/15 backdrop-blur overflow-hidden mb-10"
          >
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center p-6 md:p-8">
              <div className="text-center md:text-right">
                <span
                  className="text-white text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: next.branch.color }}
                >
                  {next.branch.name}
                </span>
                <h3 className="mt-3 text-2xl md:text-3xl font-black text-paper">الرائد × {next.opponent}</h3>
                <p className="text-paper/60 text-sm mt-1">{next.competition}</p>
              </div>
              <div className="flex flex-col items-center gap-3 order-first md:order-none">
                <Countdown target={next.date} />
              </div>
              <div className="space-y-2 text-paper/80 text-sm md:text-left">
                <p className="flex items-center gap-2 md:justify-start">
                  <CalendarDays className="h-4 w-4 text-(--silver) light:text-(--accent-deep2, var(--club))" />
                  {formatDateDMY(next.date)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-(--silver) light:text-(--accent-deep2, var(--club))" />
                  {next.location || (next.venue === 'home' ? 'الملعب البلدي بسعيدة' : 'خارج الأرض')}
                </p>
                <p className="flex items-center gap-2">
                  {next.venue === 'home' ? '🏠 المباراة على أرضنا' : '🚌 المباراة خارج أرضنا'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* القادمة */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h3 className="text-paper font-black text-lg mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-(--silver) light:text-(--accent-deep2, var(--club))" /> {t('matches.upcoming')}
            </h3>
            <div className="space-y-2.5 max-h-96 overflow-y-auto nice-scroll pl-1">
              {rest.map((m) => (
                <div key={m.id} className="[&>div]:bg-paper/10 [&>div]:border-paper/15 [&>div]:text-paper [&_span]:text-paper/90">
                  <MatchRow m={m} showBranch />
                </div>
              ))}
              {rest.length === 0 && (
                <p className="text-paper/60 text-sm text-center py-8">{t('matches.noUpcoming')}</p>
              )}
            </div>
          </motion.div>

          {/* النتائج */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h3 className="text-paper font-black text-lg mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-(--silver) light:text-(--accent-deep2, var(--club))" /> {t('matches.results')}
            </h3>
            <div className="space-y-2.5 max-h-96 overflow-y-auto nice-scroll pl-1">
              {results.map((m) => (
                <div key={m.id} className="[&>div]:bg-paper/10 [&>div]:border-paper/15 [&>div]:text-paper [&_span]:text-paper/90">
                  <MatchRow m={m} showBranch />
                </div>
              ))}
              {results.length === 0 && (
                <p className="text-paper/60 text-sm text-center py-8">{t('matches.noResults')}</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
