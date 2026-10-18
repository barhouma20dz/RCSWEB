'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsSectionHeader, VideoGrid } from './shared'
import { useT } from './i18n'
import type { GalleryImage, VideoItem } from './types'

export function GallerySection({ items, videos = [] }: { items: GalleryImage[]; videos?: VideoItem[] }) {
  const t = useT()
  const [selected, setSelected] = useState<GalleryImage | null>(null)

  return (
    <section id="gallery" className="py-16 md:py-24 club-gradient relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="gallery"
          eyebrowKey="gallery.eyebrow"
          titleKey="gallery.title"
          subtitleKey="gallery.subtitle"
        />

        <Tabs defaultValue="images" dir="rtl" className="w-full">
          <TabsList className="mx-auto flex w-fit bg-(--chip) p-1.5 rounded-2xl shadow-sm mb-8">
            <TabsTrigger
              value="images"
              className="rounded-xl px-6 data-[state=active]:bg-(--paper) data-[state=active]:text-(--ink) font-bold"
            >
              {t('gallery.images')}
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="rounded-xl px-6 data-[state=active]:bg-(--paper) data-[state=active]:text-(--ink) font-bold"
            >
              {t('gallery.videos')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images">
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3 [direction:ltr]">
              {items.map((g, i) => (
                <motion.button
                  key={g.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 4) * 0.06, duration: 0.45 }}
                  onClick={() => setSelected(g)}
                  className={`group relative block w-full overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--silver) ${
                    i % 5 === 0 ? 'aspect-square' : i % 3 === 0 ? 'aspect-[4/5]' : 'aspect-video'
                  }`}
                  aria-label={g.caption || 'صورة من معرض النادي'}
                >
                  <img
                    src={g.url}
                    alt={g.caption || 'صورة من معرض النادي'}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 right-3 left-3 text-right">
                    <div className="text-white text-sm font-bold drop-shadow">{g.caption}</div>
                    {g.branch && (
                      <span
                        className="inline-block mt-1 text-[10px] text-white font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: g.branch.color }}
                      >
                        {g.branch.name}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <VideoGrid items={videos} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">{selected?.caption || 'صورة من النادي'}</DialogTitle>
          {selected && (
            <div className="relative">
              <img
                src={selected.url}
                alt={selected.caption || 'صورة من النادي'}
                className="w-full max-h-[75vh] object-contain bg-black"
              />
              {selected.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-center text-white font-bold">
                  {selected.caption}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AnimatePresence />
    </section>
  )
}
