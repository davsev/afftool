import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getCategories } from '@/lib/mods'
import { submitMod } from '@/lib/actions'
import { ModForm } from '@/components/ModForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Submit a mod' }

export default async function SubmitPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/submit')
  const categories = await getCategories()
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-4xl tracking-tight sm:text-6xl">Submit a mod</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Share the prompt that built your mod. We review every submission before it goes live, usually within a day.
      </p>
      <div className="mt-10">
        <ModForm action={submitMod} categories={categories} userId={user.id} />
      </div>
    </div>
  )
}
