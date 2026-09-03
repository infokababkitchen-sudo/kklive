import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function authorized(request: NextRequest) {
  return Boolean(await requireStaff(request))
}

/** Uploads one dish photo to Vercel Blob and returns its public URL. */
export async function POST(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }
  const form = await request.formData()
  const file = form.get('file') as File | null
  const dishId = form.get('dishId')
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files' }, { status: 400 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not set, so photos cannot be uploaded.' },
      { status: 500 }
    )
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const blob = await put(`kabab-kitchen/dishes/${dishId}.${ext}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  })
  return NextResponse.json({ ok: true, url: blob.url })
}
