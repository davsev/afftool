import { getPublishedMod } from '@/lib/mods'
import { trackCopy } from '@/lib/actions'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const mod = await getPublishedMod((await params).slug)
  if (!mod) return new Response('Not found', { status: 404 })
  await trackCopy(mod.id, 'download').catch(() => {})
  const body = `<!-- ${mod.title} · from Modprompts -->\n\n${mod.promptMd}\n`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${mod.slug}.md"`,
    },
  })
}
