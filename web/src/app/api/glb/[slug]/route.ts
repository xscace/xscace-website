import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  // Sanitise — only allow safe filenames
  if (!/^[\w-]+\.glb$/.test(slug)) {
    return new NextResponse('Not found', { status: 404 })
  }
  try {
    const path = join(process.cwd(), 'public', 'models', slug)
    const buf = await readFile(path)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(buf.byteLength),
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
