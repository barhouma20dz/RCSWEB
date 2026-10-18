import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'الفرع غير محدد' }, { status: 400 })

    const branch = await db.branch.findUnique({
      where: { slug },
      include: {
        news: { orderBy: { createdAt: 'desc' }, take: 10 },
        players: { orderBy: [{ number: 'asc' }, { name: 'asc' }] },
        matches: { orderBy: { date: 'desc' } },
        trainings: { orderBy: { id: 'asc' } },
        achievements: { orderBy: { year: 'desc' } },
        gallery: { orderBy: { createdAt: 'desc' } },
        standings: { orderBy: [{ points: 'desc' }, { goalsFor: 'desc' }] },
        videos: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })
    // الفرع المخفي بأمر الإدارة لا يظهر للمواطنين
    if (!branch.visible) return NextResponse.json({ error: 'هذا الفرع غير متاح حالياً' }, { status: 404 })

    const now = new Date()
    const upcoming = branch.matches
      .filter((m) => m.status === 'upcoming' && new Date(m.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const results = branch.matches
      .filter((m) => m.status === 'finished')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      branch: {
        ...branch,
        matches: undefined,
        upcoming,
        results,
      },
    })
  } catch (e) {
    console.error('branch error', e)
    return NextResponse.json({ error: 'فشل تحميل بيانات الفرع' }, { status: 500 })
  }
}
