'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { SettingsSectionHeader } from './shared'
import { useT } from './i18n'
import { formatDateDMY } from '@/lib/date-format'
import type { NewsItem } from './types'

export function NewsSection({ news }: { news: NewsItem[] }) {
  const [filter, setFilter] = useState<string>('all')
  const branches = Array.from(new Map(news.map((n) => [n.branch.slug, n.branch])).values())
  const filtered = filter === 'all' ? news : news.filter((n) => n.branch.slug === filter)
  const t = useT()

  return (
    <section id="news" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern opacity-70" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="news"
          eyebrowKey="news.eyebrow"
          titleKey="news.title"
          subtitleKey="news.subtitle"
        />

        {/* فلاتر الفروع */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === 'all'
                ? 'bg-(--paper) text-(--ink) shadow-md'
                : 'bg-(--chip) text-(--ink) hover:bg-(--accent)'
            }`}
          >
            {t('news.all')}
          </button>
          {branches.map((b) => (
            <button
              key={b.slug}
              onClick={() => setFilter(b.slug)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filter === b.slug ? 'text-white shadow-md' : 'bg-(--chip) text-(--ink) hover:bg-(--accent)'
              }`}
              style={filter === b.slug ? { backgroundColor: b.color } : undefined}
            >
              {b.name}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((n, i) => (
            <motion.article
              key={n.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="card-hover rounded-2xl overflow-hidden bg-(--surface) border border-(--border) shadow-sm flex flex-col"
            >
              <div className="relative h-44">
                {n.image ? (
                   
                  <img src={n.image} alt={n.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full club-gradient" />
                )}
                <span
                  className="absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full shadow"
                  style={{ backgroundColor: n.branch.color }}
                >
                  {n.branch.name}
                </span>
                {n.featured && (
                  <span className="absolute top-3 left-3 bg-(--silver) text-(--club-dark) text-xs font-black px-3 py-1 rounded-full shadow">
                    مميز ★
                  </span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-black text-(--ink) leading-snug mb-2">{n.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{n.content}</p>
                <div className="mt-4 pt-3 border-t border-dashed border-(--border) text-xs text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-(--primary)" />
                  {formatDateDMY(n.createdAt)}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
