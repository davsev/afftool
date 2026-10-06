import Link from 'next/link'
import type { Metadata } from 'next'
import { PROMPT_TEMPLATE, SECTIONS } from '@/lib/prompt-lint'
import { CopyButton } from '@/components/CopyButton'

export const metadata: Metadata = {
  title: 'Guide',
  description: 'How to turn a Modprompts prompt into a working Claude Code mod, and how to write a good one.',
}

const ANATOMY: Record<(typeof SECTIONS)[number], string> = {
  'What it does': 'The behavior a user sees, in one paragraph.',
  'Where it shows': 'Pane, band above the prompt, status line, toast, spinner, command or guard.',
  'Events to hook': 'Which events the mod listens to, like tool.call or ui.render.',
  State: 'What it remembers between hooks.',
  Look: 'Layout, colors, refresh rate and the empty state.',
  Limits: 'What it must never do. Keep the blast radius small.',
  'Done when': 'How you check it works, plus a test.',
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-5xl tracking-tight sm:text-6xl">From prompt to mod</h1>
      <p className="mt-4 text-lg text-muted">
        A mod is a Claude Code plugin that hooks events and draws its own UI: a pane, a band above the prompt, a status line,
        a toast. You don&apos;t need to know the API. Claude does.
      </p>

      <section className="mt-14">
        <h2 className="font-display text-3xl">1. Use a prompt</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-fg/85">
          <li>
            Update Claude Code to <code className="font-mono">2.1.287</code> or later (<code className="font-mono">claude --version</code>).
            Mods also work in the Code tab of the Desktop app.
          </li>
          <li>Open a session in any folder, ideally an empty one for your mods.</li>
          <li>Paste the prompt. Edit names, colors and limits before you send it.</li>
          <li>
            Claude uses the built-in <code className="font-mono">plugin-authoring</code> skill, writes the files and runs{' '}
            <code className="font-mono">/reload-plugins</code>.
          </li>
          <li>
            Keep it for every session: add the folder as a local marketplace and install it, see{' '}
            <a className="text-accent hover:underline" href="https://code.claude.com/docs/en/plugins/mods/overview" target="_blank" rel="noreferrer">
              the mods docs
            </a>.
          </li>
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl">2. Stay safe</h2>
        <p className="mt-4 text-fg/85">
          Mods run inside Claude Code with your permissions and are not sandboxed. Read what Claude wrote, then run{' '}
          <code className="font-mono">claude plugin validate ./your-mod</code> to list every event it hooks and every call it
          makes. Turn all mods off for a session with <code className="font-mono">--safe-mode</code>.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl">3. Write a good prompt</h2>
        <p className="mt-4 text-fg/85">Every prompt on this site follows the same anatomy, so it builds right the first time.</p>
        <dl className="mt-6 divide-y divide-line rounded-2xl border border-line">
          {SECTIONS.map(s => (
            <div key={s} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
              <dt className="font-mono text-sm text-accent">{s}:</dt>
              <dd className="text-sm text-muted">{ANATOMY[s]}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-[#0d0d0f]">
          <div className="flex items-center border-b border-line px-4 py-2.5">
            <span className="font-mono text-xs text-muted">template.md</span>
            <CopyButton text={PROMPT_TEMPLATE} label="Copy template" className="ml-auto bg-accent px-3.5 py-1.5 text-sm font-medium text-bg" />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap p-5 font-mono text-[13px] leading-relaxed">{PROMPT_TEMPLATE}</pre>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl">4. Record a preview</h2>
        <p className="mt-4 text-fg/85">
          A 6-10 second loop sells a mod. Record your terminal with{' '}
          <a className="text-accent hover:underline" href="https://github.com/charmbracelet/vhs" target="_blank" rel="noreferrer">VHS</a>{' '}
          or any screen recorder at around 1280×800, crop to the window, export MP4 or GIF under 25 MB.
        </p>
        <Link href="/submit" className="mt-8 inline-block rounded-full bg-fg px-6 py-3 font-medium text-bg">
          Submit your mod
        </Link>
      </section>
    </div>
  )
}
