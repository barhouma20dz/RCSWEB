import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount, getSessionAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (account) {
      return NextResponse.json({
        account: {
          username: account.username,
          branch: {
            id: account.branch.id,
            slug: account.branch.slug,
            name: account.branch.name,
            motto: account.branch.motto,
            color: account.branch.color,
            image: account.branch.image,
          },
        },
      })
    }

    const admin = await getSessionAdmin(req)
    if (admin) {
      return NextResponse.json({
        admin: { username: admin.username, name: admin.name },
      })
    }

    return NextResponse.json({})
  } catch (e) {
    console.error('me error', e)
    return NextResponse.json({})
  }
}
