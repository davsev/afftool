import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { listByAuthorHandle } from '@/lib/mods'
import { ModGrid } from '@/components/ModGrid'
import { Avatar } from '@/components/Avatar'

export const revalidate = 300

type Params = Promise<{ handle: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: `@${(await params).handle}` }
}

export default async function ProfilePage({ params }: { params: Params }) {
  const data = await listByAuthorHandle((await params).handle)
  if (!data) notFound()
  const { author, mods } = data
  const bio = 'bio' in data ? data.bio : null
  const github = 'githubUrl' in data ? data.githubUrl : null

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <div className="flex items-center gap-5">
        <Avatar url={author.avatarUrl} name={author.displayName ?? author.handle} size={72} />
        <div>
          <h1 className="font-display text-4xl tracking-tight">{author.displayName ?? author.handle}</h1>
          <p className="mt-1 font-mono text-sm text-muted">
            @{author.handle}
            {github && (
              <> · <a href={github} target="_blank" rel="noreferrer" className="hover:text-fg">GitHub</a></>
            )}
          </p>
        </div>
      </div>
      {bio && <p className="mt-6 max-w-2xl text-muted">{bio}</p>}
      <h2 className="mb-6 mt-12 font-display text-3xl tracking-tight">{mods.length} mods</h2>
      <ModGrid mods={mods} />
    </div>
  )
}
