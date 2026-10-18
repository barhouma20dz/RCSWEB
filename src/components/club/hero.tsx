'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsStrip } from './shared'
import { useT, useLang } from './i18n'
import { useSiteSettings, siteText, DEFAULT_HERO_IMAGE } from './site-store'
import type { HomeData } from './types'

export function Hero({ data, onJoinClick }: { data: HomeData; onJoinClick: () => void }) {
  const t = useT()
  const lang = useLang((s) => s.lang)
  const settings = useSiteSettings((s) => s.settings)
  // خلفية الواجهة الرئيسية — يختارها الإدارة من إعدادات الموقع
  const heroImage = settings?.design?.heroImage?.trim() || DEFAULT_HERO_IMAGE

  return (
    <section id="home" className="relative min-h-screen flex flex-col overflow-hidden">
      {/* الخلفية */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="خلفية رياضية تعبر عن كل فروع النادي الرياضي الرائد في سعيدة"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 dark-hero-overlay"
          style={{ opacity: settings?.design?.overlay ?? 1 }}
        />
        <div className="absolute inset-0 subtle-pattern opacity-60" />
        {/* علامة مائية: الختم الرسمي الكامل بأغصان الغار (قابلة للإخفاء من الإعدادات) */}
        {settings?.design?.watermark !== false && (
          <img
            src="/images/logo-wide.png"
            alt=""
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[85%] w-auto opacity-[0.05] pointer-events-none select-none hidden md:block"
          />
        )}
      </div>

      {/* المحتوى */}
      <div className="relative flex-1 flex items-center justify-center pt-28 pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* الشعار — الدرع الكامل بأغصان الغار بلا أي قص */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mx-auto mb-6 w-fit"
          >
            <div className="animate-pulse-ring rounded-full flex items-center justify-center h-36 w-36 md:h-52 md:w-52">
              <img
                src="/images/logo-full.png"
                alt="شعار النادي الرياضي الرائد"
                className="h-full w-auto object-contain logo-glow animate-float-slow"
              />
            </div>
          </motion.div>

          {/* الاسم */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-(--silver)/15 border border-(--silver)/40 px-5 py-1.5 text-(--silver) light:text-(--accent-deep2, var(--club)) text-sm font-bold mb-5">
              <Sparkles className="h-4 w-4" />
              {t('hero.founded')} {data.stats.foundationYear} {t('hero.cityTail')}
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-paper leading-[1.15] drop-shadow-lg light:drop-shadow-sm">
              {siteText(settings?.hero?.title1, lang, t('hero.title1'))}{' '}
              <span className="silver-text">
                {siteText(settings?.hero?.titleGold, lang, t('hero.titleGold'))}
              </span>
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-bold text-paper/90">
              {siteText(settings?.hero?.subtitle, lang, t('hero.subtitle'))}
            </p>
            <p className="mt-5 text-base md:text-lg text-paper/75 max-w-2xl mx-auto leading-relaxed">
              {siteText(settings?.hero?.desc, lang, '') || t('hero.desc')}{' '}
              {data.stats.branchesCount}{' '}
              {siteText(settings?.hero?.descTail, lang, '') || t('hero.descTail')}
            </p>
          </motion.div>

          {/* الأزرار */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              onClick={onJoinClick}
              className="w-full sm:w-auto h-12 px-8 text-base font-black rounded-xl text-white bg-gradient-to-l from-(--flag-red) to-(--flag-red)/80 hover:from-(--flag-red)/90 hover:to-(--flag-red)/70 shadow-lg shadow-(--flag-red)/30 hover:shadow-(--flag-red)/45 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Users className="ml-2 h-5 w-5" />
              {t('hero.ctaJoin')}
            </Button>
            <Button
              size="lg"
              onClick={() => document.querySelector('#branches')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              className="w-full sm:w-auto bg-transparent hover:bg-paper/12 border-2 border-paper/40 text-paper hover:text-paper font-black text-base rounded-xl px-8 h-12 backdrop-blur"
            >
              {t('hero.ctaBranches')}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* شريط الإحصائيات (قابل للإخفاء من الإعدادات) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="relative px-4 pb-10"
      >
        <div className="max-w-5xl mx-auto">
          {settings?.design?.showStats !== false && <StatsStrip stats={data.stats} />}
          <div className={`text-center ${settings?.design?.showStats !== false ? 'mt-6' : ''}`}>
            <a
              href="#about"
              className="inline-flex flex-col items-center text-paper/60 hover:text-(--accent-deep, var(--silver)) transition-colors text-xs font-bold"
              aria-label="انتقل إلى قسم عن النادي"
            >
              {t('hero.more')}
              <ArrowDown className="h-4 w-4 mt-1 animate-bounce" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
