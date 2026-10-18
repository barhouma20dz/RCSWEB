import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [branches, news, matches, achievements, gallery, videos, products, playersCount, branchesCount, siteSetting] =
      await Promise.all([
        // الفروع الظاهرة فقط (أمر الإدارة: إظهار/إخفاء أي فرع)
        db.branch.findMany({
          where: { visible: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { players: true, news: true, matches: true } },
          },
        }),
        // أخبار الفروع الظاهرة فقط
        db.news.findMany({
          where: { branch: { visible: true } },
          orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
          take: 9,
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.match.findMany({
          where: { branch: { visible: true } },
          orderBy: { date: 'asc' },
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.achievement.findMany({
          where: { OR: [{ branch: null }, { branch: { visible: true } }] },
          orderBy: { year: 'desc' },
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.galleryItem.findMany({
          where: { OR: [{ branch: null }, { branch: { visible: true } }] },
          orderBy: { createdAt: 'desc' },
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.videoItem.findMany({
          where: { OR: [{ branch: null }, { branch: { visible: true } }] },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.product.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
        db.player.count({ where: { branch: { visible: true } } }),
        db.branch.count({ where: { visible: true } }),
        db.siteSetting.findUnique({ where: { key: 'site' } }),
      ])

    let settings: unknown = null
    if (siteSetting) {
      try {
        settings = JSON.parse(siteSetting.value)
      } catch {
        settings = null
      }
    }

    const now = new Date()
    const upcoming = matches
      .filter((m) => m.status === 'upcoming' && new Date(m.date) >= now)
      .slice(0, 6)
    const results = matches
      .filter((m) => m.status === 'finished')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)

    const titlesCount = achievements.filter((a) =>
      /بطل|كأس|لقب|ذهبية|ميداليات|دوري|تأسيس/.test(a.title)
    ).length + 12

    return NextResponse.json({
      branches,
      news,
      upcoming,
      results,
      achievements,
      gallery,
      videos,
      products,
      settings,
      stats: {
        branchesCount,
        playersCount,
        titlesCount,
        foundationYear: 2024,
        fansCount: 12500,
        medalsCount: 48,
      },
    })
  } catch (e) {
    console.error('home error', e)
    return NextResponse.json({ error: 'فشل تحميل بيانات الصفحة الرئيسية' }, { status: 500 })
  }
}
