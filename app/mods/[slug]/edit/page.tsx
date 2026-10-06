import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getCategories, MOD_SELECT, rowToMod } from '@/lib/mods'
import { updateMod } from '@/lib/actions'
import { createSessionClient } from '@/lib/supabase/server'
import { ModForm } from '@/components/ModForm'

export const metadata: Metadata = { title: 'Edit mod' }

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/mods/${slug}/edit`)
  const sb = await createSessionClient()
  const { data } = await sb.from('mods').select(MOD_SELECT).eq('slug', slug).eq('author_id', user.id).maybeSingle()
  if (!data) notFound()
  const mod = rowToMod(data)
  if (mod.status === 'published') redirect(`/mods/${slug}`)
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Edit {mod.title}</h1>
      {mod.reviewNote && (
        <p className="mt-4 rounded-xl border border-bad/30 bg-bad/5 p-4 text-sm text-bad">Reviewer note: {mod.reviewNote}</p>
      )}
      <div className="mt-10">
        <ModForm
          action={updateMod.bind(null, mod.id)}
          categories={categories}
          userId={user.id}
          initial={mod}
          submitLabel="Resubmit for review"
        />
      </div>
    </div>
  )
}
