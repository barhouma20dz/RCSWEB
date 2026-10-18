'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Trophy, Users, Medal, Flag, Play } from 'lucide-react'
import { useT, type TKey } from './i18n'
import { useSectionTexts } from './site-store'
import type { VideoItem } from './types'

export function useInViewOnce() {
  const [inView, setInView] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.3 }
    )
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, inView])

  return { ref: setRef, inView }
}

export function AnimatedNumber({
  value,
  suffix = '',
  duration = 1600,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const { ref, inView } = useInViewOnce()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {display.toLocaleString('ar-DZ')}
      {suffix}
    </span>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  light?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="text-center max-w-2xl mx-auto mb-10 md:mb-14 px-4"
    >
      <span
        className={`inline-flex items-center gap-2 text-sm font-bold tracking-wide px-4 py-1.5 rounded-full ${
          light ? 'bg-paper/10 text-(--silver) light:text-(--accent-deep2, var(--club))' : 'bg-(--chip) text-primary'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-(--silver) light:bg-(--accent-deep2, var(--club))' : 'bg-(--flag-red)'}`} />
        {eyebrow}
        <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-(--silver) light:bg-(--accent-deep2, var(--club))' : 'bg-(--flag-red)'}`} />
      </span>
      <h2
        className={`mt-4 text-3xl md:text-4xl font-black leading-snug ${
          light ? 'text-paper' : 'text-(--ink)'
        }`}
      >
        {title}
      </h2>
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className={`h-px w-14 bg-gradient-to-l from-transparent to-transparent ${light ? 'via-(--silver) light:via-(--accent-deep2, var(--club))' : 'via-(--primary)'}`} />
        <Trophy className={`h-4 w-4 ${light ? 'text-(--silver) light:text-(--accent-deep2, var(--club))' : 'text-(--flag-red)'}`} />
        <span className={`h-px w-14 bg-gradient-to-r from-transparent to-transparent ${light ? 'via-(--silver) light:via-(--accent-deep2, var(--club))' : 'via-(--primary)'}`} />
      </div>
      {subtitle && (
        <p className={`mt-4 leading-relaxed ${light ? 'text-paper/75' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

/**
 * ترويسة قسم ذكية — تتجاوز نصوصها من إعدادات الإدارة (بثلاث لغات)
 * وتعود إلى النصوص الافتراضية من القاموس عند غياب الإعداد.
 */
export function SettingsSectionHeader({
  section,
  eyebrowKey,
  titleKey,
  subtitleKey,
  light = false,
}: {
  section: string
  eyebrowKey: TKey
  titleKey: TKey
  subtitleKey?: TKey
  light?: boolean
}) {
  const t = useT()
  const ov = useSectionTexts(section)
  return (
    <SectionHeader
      light={light}
      eyebrow={ov.eyebrow ?? t(eyebrowKey)}
      title={ov.title ?? t(titleKey)}
      subtitle={ov.subtitle ?? (subtitleKey ? t(subtitleKey) : undefined)}
    />
  )
}

export function StatsStrip({
  stats,
}: {
  stats: { branchesCount: number; playersCount: number; titlesCount: number; foundationYear: number; fansCount: number; medalsCount: number }
}) {
  const t = useT()
  const items = [
    { icon: Flag, value: stats.branchesCount, label: t('stats.branches') },
    { icon: Users, value: stats.playersCount, label: t('stats.players') },
    { icon: Trophy, value: stats.titlesCount, label: t('stats.titles') },
    { icon: Medal, value: stats.medalsCount, label: t('stats.medals') },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="rounded-2xl bg-paper/10 border border-paper/15 backdrop-blur px-4 py-5 text-center"
        >
          <item.icon className="h-6 w-6 text-(--silver) light:text-(--accent-deep2, var(--club)) mx-auto mb-2" />
          <div className="text-2xl md:text-3xl font-black text-paper">
            <AnimatedNumber value={item.value} />
          </div>
          <div className="text-xs md:text-sm text-paper/70 mt-1 font-semibold">{item.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

// ==================== عارض الفيديوهات المشترك ====================

/** تحويل روابط يوتيوب (watch?v= أو youtu.be) إلى رابط embed */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      if (u.pathname.startsWith('/embed/')) return url
    }
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    return url
  } catch {
    return url
  }
}

function isDirectVideo(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase()
  return /\.(mp4|webm|ogg|mov|m4v)$/.test(clean) || clean.startsWith('/videos/')
}

/** نافذة تشغيل الفيديو: mp4 محلي عبر video، ويوتيوب عبر iframe embed */
export function VideoPlayerDialog({
  item,
  onClose,
}: {
  item: VideoItem | null
  onClose: () => void
}) {
  const t = useT()
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 bg-black border-none overflow-hidden">
        <DialogTitle className="sr-only">{item?.title || t('gallery.play')}</DialogTitle>
        {item && (
          <div>
            <div className="aspect-video bg-black">
              {isDirectVideo(item.url) ? (
                <video
                  src={item.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full"
                />
              ) : (
                <iframe
                  src={toEmbedUrl(item.url)}
                  title={item.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
            <div className="p-4">
              <p className="text-white font-bold">{item.title}</p>
              {item.branch && (
                <span
                  className="inline-block mt-2 text-[10px] text-white font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: item.branch.color }}
                >
                  {item.branch.name}
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** شبكة بطاقات الفيديو مع عارض مدمج */
export function VideoGrid({ items }: { items: VideoItem[] }) {
  const t = useT()
  const [selected, setSelected] = useState<VideoItem | null>(null)

  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-10 text-sm">{t('gallery.noVideos')}</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((v, i) => (
          <motion.button
            key={v.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
            onClick={() => setSelected(v)}
            className="card-hover group relative rounded-2xl overflow-hidden bg-(--surface) border border-(--border) shadow-sm text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-(--silver)"
            aria-label={`${t('gallery.play')}: ${v.title}`}
          >
            <div className="relative aspect-video overflow-hidden">
              {v.thumb ? (
                <img
                  src={v.thumb}
                  alt={v.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="h-full w-full club-gradient" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-14 w-14 rounded-full bg-(--silver)/90 text-(--club-dark) flex items-center justify-center shadow-xl shadow-black/30 group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 fill-current" />
                </span>
              </span>
              {v.branch && (
                <span
                  className="absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: v.branch.color }}
                >
                  {v.branch.name}
                </span>
              )}
            </div>
            <p className="p-3 font-bold text-sm text-(--ink) truncate">{v.title}</p>
          </motion.button>
        ))}
      </div>
      <VideoPlayerDialog item={selected} onClose={() => setSelected(null)} />
    </>
  )
}
