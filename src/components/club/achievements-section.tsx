'use client'

import { motion } from 'framer-motion'
import { Medal } from 'lucide-react'
import { SettingsSectionHeader } from './shared'
import { useT } from './i18n'
import type { AchievementItem } from './types'

export function AchievementsSection({ achievements }: { achievements: AchievementItem[] }) {
  const sorted = [...achievements].sort((a, b) => b.year.localeCompare(a.year))
  const t = useT()

  return (
    <section id="achievements" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="achievements"
          eyebrowKey="achievements.eyebrow"
          titleKey="achievements.title"
          subtitleKey="achievements.subtitle"
        />

        <div className="relative">
          {/* الخط الزمني */}
          <div className="absolute right-4 md:right-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-(--primary)/50 via-(--club)/25 to-transparent md:translate-x-1/2" />

          <div className="space-y-6 md:space-y-8">
            {sorted.map((a, i) => {
              const rightSide = i % 2 === 0
              const card = (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="card-hover rounded-2xl bg-(--surface) border border-(--border) shadow-sm p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-(--chip) text-(--primary) text-sm font-black px-3 py-0.5 rounded-full">
                      {a.year}
                    </span>
                    {a.branch && (
                      <span
                        className="text-white text-xs font-bold px-3 py-0.5 rounded-full"
                        style={{ backgroundColor: a.branch.color }}
                      >
                        {a.branch.name}
                      </span>
                    )}
                    {!a.branch && (
                      <span className="bg-(--paper) text-(--ink) text-xs font-bold px-3 py-0.5 rounded-full">
                        النادي
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-(--ink) leading-snug">{a.title}</h3>
                  {a.description && (
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{a.description}</p>
                  )}
                </motion.div>
              )
              return (
                <div key={a.id} className="relative grid md:grid-cols-2 gap-4 md:gap-10 items-center">
                  {/* النقطة */}
                  <div className="absolute right-4 md:right-1/2 top-8 h-4 w-4 rounded-full bg-(--primary) ring-4 ring-(--primary)/20 md:translate-x-1/2 z-10" />
                  <div className={rightSide ? 'md:col-start-1 md:pl-0 md:pr-10 md:text-left' : 'hidden md:block md:order-2'}>
                    {rightSide ? card : null}
                  </div>
                  <div className={!rightSide ? 'md:col-start-2 md:pr-0 md:pl-10 md:text-right pr-12' : 'hidden md:block md:order-1'}>
                    {!rightSide ? card : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-2xl club-gradient text-paper px-6 py-4 border border-paper/15 light:border-transparent shadow-lg shadow-black/20 light:shadow-(--club)/20">
            <Medal className="h-8 w-8 text-(--silver)" />
            <div className="text-right">
              <div className="font-black text-lg">وأضخم السجل قادم بإذن الله</div>
              <div className="text-paper/70 text-sm">جيل جديد من الأبطال يصنع التاريخ الآن</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
