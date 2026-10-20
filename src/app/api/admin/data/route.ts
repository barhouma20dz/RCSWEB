import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    // ملاحظة: ترتيب التفكيك يجب أن يطابق ترتيب الاستعلامات في Promise.all تماماً
    const [branchesCount, newsCount, playersCount, matchesCount, pendingEnrollments, messagesCount, pendingOrders, membersCount, documentsCount, templatesCount, branches, news, enrollments, messages, orders, products, members, documents, siteSetting, achievements, templates] =
      await Promise.all([
        db.branch.count(),
        db.news.count(),
        db.player.count(),
        db.match.count(),
        db.enrollment.count({ where: { status: 'pending' } }),
        db.contactMessage.count(),
        db.shopOrder.count({ where: { status: 'pending' } }),
        db.branchMember.count(),
        db.clubDocument.count(),
        db.documentTemplate.count(),
        db.branch.findMany({
          orderBy: { sortOrder: 'asc' },
          include: {
            account: { select: { username: true } },
            _count: {
              select: { players: true, news: true, matches: true, enrollments: true, trainings: true, gallery: true },
            },
          },
        }),
        db.news.findMany({
          orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.enrollment.findMany({
          orderBy: { createdAt: 'desc' },
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }),
        db.shopOrder.findMany({
          orderBy: { createdAt: 'desc' },
          include: { product: { select: { id: true, name: true, price: true, image: true } } },
        }),
        db.product.findMany({ orderBy: { createdAt: 'asc' } }),
        db.branchMember.findMany({
          orderBy: [{ branchId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { branch: { select: { name: true, slug: true, color: true } }, _count: { select: { documents: true } } },
        }),
        db.clubDocument.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            branch: { select: { name: true, slug: true, color: true } },
            member: { select: { id: true, firstName: true, lastName: true, position: true } },
          },
        }),
        db.siteSetting.findUnique({ where: { key: 'site' } }),
        db.achievement.findMany({
          orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
          include: { branch: { select: { name: true, slug: true, color: true } } },
        }),
        db.documentTemplate.findMany({
          orderBy: { createdAt: 'desc' },
          // fileData ثقيل — لا يُرسل في قائمة العرض، يُجلب عند الطلب الفعلي
          select: { id: true, name: true, kind: true, category: true, fileType: true, fields: true, active: true, createdAt: true, updatedAt: true },
        }),
      ])

    let settings: unknown = null
    if (siteSetting) {
      try {
        settings = JSON.parse(siteSetting.value)
      } catch {
        settings = null
      }
    }

    return NextResponse.json({
      stats: {
        branchesCount,
        newsCount,
        playersCount,
        matchesCount,
        pendingEnrollments,
        messagesCount,
        pendingOrders,
        membersCount,
        documentsCount,
        templatesCount,
      },
      branches: branches.map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        motto: b.motto,
        description: b.description,
        icon: b.icon,
        color: b.color,
        image: b.image,
        visible: b.visible,
        sortOrder: b.sortOrder,
        accountUsername: b.account?.username ?? null,
        counts: {
          players: b._count.players,
          news: b._count.news,
          matches: b._count.matches,
          enrollments: b._count.enrollments,
          trainings: b._count.trainings,
          gallery: b._count.gallery,
        },
      })),
      news,
      enrollments: enrollments.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        fullName: e.fullName,
        gender: e.gender,
        birthDate: e.birthDate,
        parentName: e.parentName,
        age: e.age,
        phone: e.phone,
        note: e.note,
        status: e.status,
        createdAt: e.createdAt,
        branch: { name: e.branch.name, slug: e.branch.slug, color: e.branch.color },
      })),
      messages,
      orders,
      products,
      members,
      documents,
      achievements,
      templates,
      settings,
    })
  } catch (e) {
    console.error('admin data error', e)
    return NextResponse.json({ error: 'فشل تحميل بيانات لوحة الإدارة' }, { status: 500 })
  }
}
