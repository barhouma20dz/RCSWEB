import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionAccount, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()

    const branchId = account.branchId
    const [branch, news, players, matches, trainings, enrollments, gallery, standings, videos, members, documents] =
      await Promise.all([
        db.branch.findUnique({ where: { id: branchId } }),
        db.news.findMany({ where: { branchId }, orderBy: { createdAt: 'desc' } }),
        db.player.findMany({ where: { branchId }, orderBy: [{ number: 'asc' }, { name: 'asc' }] }),
        db.match.findMany({ where: { branchId }, orderBy: { date: 'desc' } }),
        db.training.findMany({ where: { branchId }, orderBy: { id: 'asc' } }),
        db.enrollment.findMany({ where: { branchId }, orderBy: { createdAt: 'desc' } }),
        db.galleryItem.findMany({ where: { branchId }, orderBy: { createdAt: 'desc' } }),
        db.standing.findMany({ where: { branchId }, orderBy: [{ points: 'desc' }, { goalsFor: 'desc' }] }),
        db.videoItem.findMany({ where: { branchId }, orderBy: { createdAt: 'desc' } }),
        db.branchMember.findMany({
          where: { branchId },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }),
        db.clubDocument.findMany({
          where: { visibleToBranch: true, OR: [{ branchId }, { branchId: null }] },
          orderBy: { createdAt: 'desc' },
          include: {
            branch: { select: { name: true, slug: true, color: true } },
            member: { select: { id: true, firstName: true, lastName: true, position: true } },
          },
        }),
      ])

    if (!branch) return unauthorized()

    const now = new Date()
    return NextResponse.json({
      branch,
      news,
      players,
      matches,
      trainings,
      enrollments,
      gallery,
      standings,
      videos,
      members,
      documents,
      stats: {
        playersCount: players.length,
        newsCount: news.length,
        upcomingCount: matches.filter((m) => m.status === 'upcoming' && new Date(m.date) >= now).length,
        pendingEnrollments: enrollments.filter((e) => e.status === 'pending').length,
        galleryCount: gallery.length,
        trainingsCount: trainings.length,
        standingsCount: standings.length,
        videosCount: videos.length,
        membersCount: members.length,
        documentsCount: documents.length,
      },
    })
  } catch (e) {
    console.error('office data error', e)
    return NextResponse.json({ error: 'فشل تحميل بيانات المكتب' }, { status: 500 })
  }
}
