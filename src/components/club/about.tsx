'use client'

import { motion } from 'framer-motion'
import { Target, HeartHandshake, ShieldCheck, MapPin, Quote } from 'lucide-react'
import { SettingsSectionHeader } from './shared'
import { useT } from './i18n'

import { useSiteSettings } from './site-store'

const values = [
  {
    icon: Target,
    title: 'رؤيتنا',
    text: 'أن نكون الخيار الأول للرياضة والتكوين في سعيدة، ونموذجاً وطنياً يُحتذى في إدارة الأندية المتعددة التخصصات.',
  },
  {
    icon: HeartHandshake,
    title: 'قيمنا',
    text: 'الانضباط، الروح الرياضية، العمل الجماعي، واحترام المنافس — قيم نغرسها في كل رياضي قبل أن نعلمه المهارة.',
  },
  {
    icon: ShieldCheck,
    title: 'رسالتنا',
    text: 'اكتشاف المواهب وصقلها ببرامج تدريبية علمية، وتوفير بيئة آمنة ومحفزة لجميع الفئات من الأطفال إلى الكبار.',
  },
]

export function About() {
  const t = useT()
  const settings = useSiteSettings((s) => s.settings)
  const president = settings?.president
  const presName = president?.name?.trim() || 'السيد عبد الرحمن بلقاسم'
  const presTitle = president?.title?.trim() || 'رئيس النادي الرياضي الرائد'
  const presSpeech =
    president?.speech?.trim() ||
    'النادي ليس مجرد ملعب وقاعة، بل مدرسة للحياة. كل طفل يرتدي قميص الرائد يتعلم الانضباط والصبر والفخر بالانتماء. نحن نستثمر في الإنسان قبل البطولة، ولذلك ستظل مدرجاتنا مفتوحة أمام كل شغيف بالرياضة في سعيدة — هلا بك في عائلة الرائد.'
  const presInitial = president?.initial?.trim() || presName.replace(/^(السيد|الرئيس|الأستاذ)\s+/, '').charAt(0) || 'ر'
  const presFacilities = president?.facilities && president.facilities.length > 0
    ? president.facilities
    : ['حي الملعب، بلدية سعيدة', 'ولاية سعيدة — الجزائر', 'ملعب بلدي + قاعة متعددة + مسبح']

  return (
    <section id="about" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="about"
          eyebrowKey="about.eyebrow"
          titleKey="about.title"
          subtitleKey="about.subtitle"
        />

        <div className="grid lg:grid-cols-3 gap-5 md:gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.55 }}
              className="card-hover group rounded-2xl border border-(--border) bg-(--surface) p-6 md:p-7 shadow-sm hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl club-gradient flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <v.icon className="h-7 w-7 text-(--silver) light:text-(--accent-deep2, var(--club))" />
              </div>
              <h3 className="text-xl font-black text-(--ink) mb-2">{v.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{v.text}</p>
            </motion.div>
          ))}
        </div>

        {/* كلمة الرئيس */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 md:mt-16 rounded-3xl club-gradient p-6 md:p-10 relative overflow-hidden border border-paper/15 light:border-transparent shadow-xl shadow-black/20 light:shadow-lg light:shadow-(--club)/20"
        >
          <Quote className="absolute top-6 right-6 h-16 w-16 text-paper/10" />
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center relative">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-paper mb-4">
                كلمة رئيس النادي
              </h3>
              <p className="text-paper/85 leading-loose text-sm md:text-base whitespace-pre-line">
                &quot;{presSpeech}&quot;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-(--silver)/20 ring-2 ring-(--silver)/60 flex items-center justify-center text-(--silver) font-black text-lg">
                  {presInitial}
                </div>
                <div>
                  <div className="font-black text-paper">{presName}</div>
                  <div className="text-(--silver) text-sm font-bold">{presTitle}</div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex flex-col gap-3 text-paper/80 text-sm font-bold border-r border-paper/15 pr-6">
              {presFacilities.map((fac, idx) => (
                <span key={idx} className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-(--silver) light:text-(--accent-deep2, var(--club))" /> {fac}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
