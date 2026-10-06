'use client'
import { useActionState, useMemo, useState } from 'react'
import { REACHES, SURFACES, SURFACE_LABELS, type Reach, type Surface } from '@/lib/schema'
import { missingSections, PROMPT_TEMPLATE } from '@/lib/prompt-lint'
import type { SubmitResult } from '@/lib/submit'
import type { Category, Mod } from '@/lib/types'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { ModCard } from './ModCard'

type Action = (prev: SubmitResult | null, fd: FormData) => Promise<SubmitResult>

type Props = {
  action: Action
  categories: Category[]
  userId: string
  initial?: Mod
  submitLabel?: string
}

const REACH_LABEL: Record<Reach, string> = {
  files: 'Files',
  network: 'Network',
  processes: 'Processes',
  model: 'Model calls',
  none: 'Nothing outside Claude Code',
}

const MAX_BYTES = 25 * 1024 * 1024

export function ModForm({ action, categories, userId, initial, submitLabel = 'Submit for review' }: Props) {
  const [state, formAction, pending] = useActionState(action, null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [tagline, setTagline] = useState(initial?.tagline ?? '')
  const [prompt, setPrompt] = useState(initial?.promptMd ?? PROMPT_TEMPLATE)
  const [surfaces, setSurfaces] = useState<Surface[]>(initial?.surfaces ?? [])
  const [media, setMedia] = useState({
    url: initial?.previewUrl ?? '',
    type: initial?.mediaType ?? '',
  })
  const [upload, setUpload] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [uploadError, setUploadError] = useState('')

  const missing = useMemo(() => missingSections(prompt), [prompt])
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {}

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      setUploadError('Max 25 MB')
      setUpload('error')
      return
    }
    setUpload('uploading')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const sb = createBrowserSupabase()
    const { error } = await sb.storage.from('previews').upload(path, file, { contentType: file.type })
    if (error) {
      setUploadError(error.message)
      setUpload('error')
      return
    }
    const { data } = sb.storage.from('previews').getPublicUrl(path)
    const type = file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image'
    setMedia({ url: data.publicUrl, type })
    setUpload('idle')
  }

  const preview: Mod = {
    id: 'preview',
    slug: 'preview',
    title: title || 'Your mod title',
    tagline: tagline || 'One line on what it does and where it shows.',
    descriptionMd: '',
    promptMd: prompt,
    category: null,
    surfaces: surfaces.length ? surfaces : ['pane'],
    reaches: [],
    previewUrl: media.url || null,
    posterUrl: null,
    mediaType: (media.type || null) as Mod['mediaType'],
    repoUrl: null,
    installCmd: null,
    minCcVersion: null,
    status: 'draft',
    reviewNote: null,
    isFeatured: false,
    copyCount: 0,
    likeCount: 0,
    publishedAt: null,
    author: { id: userId, handle: 'you', displayName: null, avatarUrl: null },
    mock: { lines: [title || 'your mod', tagline || 'shows up here'] },
  }

  const input = 'w-full rounded-xl border border-line bg-surface px-4 py-2.5 focus:border-fg/40 focus:outline-none'
  const err = (k: string) => errors[k]?.[0] && <p className="mt-1 text-sm text-bad">{errors[k]![0]}</p>

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <form action={formAction} className="space-y-7">
        <Field label="Title" hint="3-60 characters">
          <input name="title" value={title} onChange={e => setTitle(e.target.value)} className={input} maxLength={60} required />
          {err('title')}
        </Field>

        <Field label="Tagline" hint={`${tagline.length}/120`}>
          <input name="tagline" value={tagline} onChange={e => setTagline(e.target.value)} className={input} maxLength={120} required />
          {err('tagline')}
        </Field>

        <Field label="Category">
          <select name="categorySlug" defaultValue={initial?.category?.slug ?? ''} className={input} required>
            <option value="" disabled>Pick one</option>
            {categories.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          {err('categorySlug')}
        </Field>

        <Field group label="Where it shows">
          <div className="flex flex-wrap gap-2">
            {SURFACES.map(s => (
              <label key={s} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="surfaces"
                  value={s}
                  checked={surfaces.includes(s)}
                  onChange={e => setSurfaces(v => (e.target.checked ? [...v, s] : v.filter(x => x !== s)))}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full border border-line px-3.5 py-1.5 text-sm text-muted peer-checked:border-fg peer-checked:bg-fg peer-checked:text-bg peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                  {SURFACE_LABELS[s]}
                </span>
              </label>
            ))}
          </div>
          {err('surfaces')}
        </Field>

        <Field group label="What it reaches" hint="Be honest. Shown on the mod page.">
          <div className="flex flex-wrap gap-2">
            {REACHES.map(r => (
              <label key={r} className="cursor-pointer">
                <input type="checkbox" name="reaches" value={r} defaultChecked={initial?.reaches.includes(r)} className="peer sr-only" />
                <span className="inline-block rounded-full border border-line px-3.5 py-1.5 text-sm text-muted peer-checked:border-fg peer-checked:bg-fg peer-checked:text-bg peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                  {REACH_LABEL[r]}
                </span>
              </label>
            ))}
          </div>
          {err('reaches')}
        </Field>

        <Field label="The prompt" hint="Follow the anatomy so it builds right the first time.">
          <textarea
            name="promptMd"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={18}
            className={`${input} font-mono text-[13px] leading-relaxed`}
            required
          />
          {missing.length > 0 && (
            <p className="mt-2 text-sm text-warn">Missing sections: {missing.join(', ')}</p>
          )}
          {err('promptMd')}
        </Field>

        <Field label="Description" hint="Optional. A few sentences on why it's useful.">
          <textarea name="descriptionMd" defaultValue={initial?.descriptionMd} rows={4} className={input} maxLength={5000} />
        </Field>

        <Field label="Preview" hint="10 second video, GIF or screenshot. Max 25 MB.">
          <input
            type="file"
            accept="video/mp4,video/webm,image/gif,image/png,image/jpeg,image/webp"
            onChange={onFile}
            className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-raised file:px-4 file:py-2 file:text-fg"
          />
          {upload === 'uploading' && <p className="mt-2 text-sm text-muted">Uploading…</p>}
          {upload === 'error' && <p className="mt-2 text-sm text-bad">{uploadError}</p>}
          <input type="hidden" name="previewUrl" value={media.url} />
          <input type="hidden" name="mediaType" value={media.type} />
        </Field>

        <details className="rounded-xl border border-line p-4">
          <summary className="cursor-pointer text-sm">Optional: link your own version</summary>
          <div className="mt-4 space-y-5">
            <Field label="Repo URL" hint="GitHub or GitLab">
              <input name="repoUrl" defaultValue={initial?.repoUrl ?? ''} className={input} placeholder="https://github.com/you/mod" />
              {err('repoUrl')}
            </Field>
            <Field label="Install command">
              <input
                name="installCmd"
                defaultValue={initial?.installCmd ?? ''}
                className={`${input} font-mono text-sm`}
                placeholder="/plugin install my-mod@my-marketplace"
              />
              {err('installCmd')}
            </Field>
            <Field label="Tested with Claude Code" hint="e.g. 2.1.290">
              <input name="minCcVersion" defaultValue={initial?.minCcVersion ?? ''} className={input} />
              {err('minCcVersion')}
            </Field>
          </div>
        </details>

        {state && !state.ok && state.error && <p className="text-sm text-bad">{state.error}</p>}

        <button
          disabled={pending || upload === 'uploading'}
          className="rounded-full bg-accent px-6 py-3 font-medium text-bg hover:bg-[#ff7f59] disabled:opacity-60"
        >
          {pending ? 'Sending…' : submitLabel}
        </button>
      </form>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">Card preview</p>
        <div className="pointer-events-none">
          <ModCard mod={preview} />
        </div>
      </aside>
    </div>
  )
}

function Field({ label, hint, group, children }: { label: string; hint?: string; group?: boolean; children: React.ReactNode }) {
  const head = (
    <span className="mb-2 flex items-baseline justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </span>
  )
  if (group) {
    return (
      <fieldset>
        <legend className="w-full">{head}</legend>
        {children}
      </fieldset>
    )
  }
  return (
    <label className="block">
      {head}
      {children}
    </label>
  )
}
