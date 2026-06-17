import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const filename = params.slug.endsWith('.glb') ? params.slug : `${params.slug}.glb`
    if (!/^[\w\-\.]+\.glb$/.test(filename)) {
      return new NextResponse('Not found', { status: 404 })
    }
    const filepath = join(process.cwd(), 'public', 'models', filename)
    const data = await readFile(filepath)
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
