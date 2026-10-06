import type { Mod } from '@/lib/types'
import type { Reach, Surface } from '@/lib/schema'

export const CATEGORIES = [
  { slug: 'productivity', name: 'Productivity' },
  { slug: 'monitoring', name: 'Monitoring' },
  { slug: 'safety', name: 'Safety' },
  { slug: 'fun-games', name: 'Fun & games' },
  { slug: 'git-ci', name: 'Git & CI' },
  { slug: 'context-tokens', name: 'Context & tokens' },
  { slug: 'ui-themes', name: 'UI & themes' },
  { slug: 'workflow', name: 'Workflow' },
]

const AUTHOR = { id: 'seed', handle: 'modprompts', displayName: 'Modprompts', avatarUrl: null }

const FOOTER = (name: string) => `
Use the plugin-authoring skill. Put it in ./${name}/ as a plugin with
.claude-plugin/plugin.json, hooks/hooks.json and hooks/register.ts,
then load it with /reload-plugins.`

type Seed = {
  slug: string
  title: string
  tagline: string
  description: string
  category: string
  surfaces: Surface[]
  reaches: Reach[]
  featured?: boolean
  prompt: string
  mock: string[]
  accent?: string
  copies: number
}

const SEEDS: Seed[] = [
  {
    slug: 'context-fuel-gauge',
    title: 'Context Fuel Gauge',
    tagline: 'A slim band above the prompt that shows how full your context window is, and how fast it fills.',
    description:
      'Reads token usage after every request and draws a fuel bar with a burn rate. Turns amber at 70% and red at 90%, so you know when to compact before it bites.',
    category: 'context-tokens',
    surfaces: ['band'],
    reaches: ['none'],
    featured: true,
    copies: 412,
    accent: '#FFB547',
    mock: ['▕██████████████░░░░░░▏ 71% context', 'burn 3.2k tok/turn · ~9 turns left', '> refactor the auth module'],
    prompt: `Build me a Claude Code mod called context-fuel-gauge.

What it does: after every model request, read the token usage and show how full the context window is as a horizontal fuel bar, plus the average tokens used per turn and an estimate of turns left.
Where it shows: a one-line band above the prompt.
Events to hook: the request/response events that carry usage, and ui.render for the band.
State: the last 10 turns of input token counts, kept in module variables.
Look: a 20-cell bar using block characters, percentage on the right, then "burn X tok/turn · ~N turns left". Dim gray under 70%, amber 70-90%, red above 90%. Before the first request, show "waiting for first turn".
Commands: /fuel reset clears the history.
Limits: no network, no file writes, no model calls.
Done when: the bar moves after each turn and changes color at 70% and 90%; add a test with the mods test kit that feeds fake usage events and checks the color thresholds.
${FOOTER('context-fuel-gauge')}`,
  },
  {
    slug: 'tool-call-counter',
    title: 'Tool Call Counter',
    tagline: 'Adds a live count of tool calls to the spinner while Claude works.',
    description:
      'The smallest useful mod. Counts every tool call in the current turn and writes it next to the spinner word, so long turns feel less like a black box.',
    category: 'monitoring',
    surfaces: ['spinner'],
    reaches: ['none'],
    copies: 288,
    mock: ['✻ Thinking · tool calls: 7…', '  ⎿ Read src/auth/session.ts', '  ⎿ Grep "refreshToken"'],
    prompt: `Build me a Claude Code mod called tool-call-counter.

What it does: count the tool calls Claude makes in the current turn and show the count beside the spinner, like "Thinking · tool calls: 3…".
Where it shows: the spinner suffix.
Events to hook: tool.call to count, turn start to reset, ui.render with component 'Spinner' to draw.
State: a single counter in a module variable.
Look: keep the original spinner, append " · tool calls: N…". Hide the suffix when N is 0.
Limits: no network, no files, no model calls. Always call next(e) so tools run as usual.
Done when: the number climbs during a multi-tool turn and resets on the next prompt; include a test that sends three tool.call events and checks the rendered suffix.
${FOOTER('tool-call-counter')}`,
  },
  {
    slug: 'blast-shield',
    title: 'Blast Shield',
    tagline: 'Holds rm -rf, force pushes and DROP TABLE until you see what they would hit and say yes.',
    description:
      'A guard for destructive shell commands. Instead of a plain permission prompt, it opens a pane that lists the files, branch or table the command touches, with Proceed and Cancel buttons.',
    category: 'safety',
    surfaces: ['guard', 'pane'],
    reaches: ['files', 'processes'],
    featured: true,
    copies: 655,
    accent: '#FF5C5C',
    mock: ['⚠ HELD  rm -rf ./dist ./build', '  would delete 1,284 files · 48.2 MB', '  [ Proceed ]   [ Cancel ]'],
    prompt: `Build me a Claude Code mod called blast-shield.

What it does: hold destructive Bash tool calls before they run and show what they would affect. Covers rm -rf, git push --force / -f, git reset --hard, git clean -fd, and SQL with DROP or TRUNCATE.
Where it shows: a pane beside the transcript that opens only while a command is held.
Events to hook: tool.call with a matcher for the Bash tool.
State: the held command and its preview.
Look: red header "HELD", the command in mono, then the impact: file count and size for rm (dry run with find), commits that would be lost for force push (git log remote..local), the table name for SQL. Two buttons: Proceed and Cancel. Enter = Proceed, Esc = Cancel.
Limits: previews must be read-only. Never run the held command yourself; Proceed just calls next(e). Time out after 5 minutes as Cancel.
Done when: "rm -rf ./tmp-test" is held with a correct file count, Cancel returns a refusal to Claude, Proceed runs it; tests cover the pattern matcher with 10 safe and 10 dangerous commands.
${FOOTER('blast-shield')}`,
  },
  {
    slug: 'ci-radar',
    title: 'CI Radar',
    tagline: 'A pane that watches the CI checks for your current branch and pings you when they flip.',
    description:
      'Polls GitHub check runs for the branch you are on and lists them with live status. A toast fires when a check goes red or the whole run goes green.',
    category: 'git-ci',
    surfaces: ['pane', 'toast'],
    reaches: ['network', 'processes'],
    copies: 341,
    accent: '#5CE1A0',
    mock: ['CI · feature/login', '  ✓ lint            12s', '  ✓ unit tests      1m04s', '  ● e2e             running'],
    prompt: `Build me a Claude Code mod called ci-radar.

What it does: show the CI check runs for the current git branch and alert me when one fails or all pass.
Where it shows: a pane titled "CI", plus a toast on state changes.
Events to hook: session start to begin polling, a 30 second timer, ui.render for the pane.
State: the last known status of each check by name.
Look: branch name at the top, then one row per check: icon (✓ green, ✗ red, ● amber pulsing for running), name, duration. Empty state: "No checks for this branch yet".
Commands: /ci opens or closes the pane, /ci now forces a refresh.
Limits: use the gh CLI (gh pr checks or gh run list) through the mods process API; no tokens in code. Stop polling when the pane is closed for 10 minutes.
Done when: pushing a branch shows its checks within 30s and a failing check raises one toast; test the status-diff function that decides when to toast.
${FOOTER('ci-radar')}`,
  },
  {
    slug: 'turn-cost-meter',
    title: 'Turn Cost Meter',
    tagline: 'A status line with the cost of the last turn and the running total for the session.',
    description:
      'Turns token usage into dollars using the model price table, and keeps a session total. Handy when you are on API billing and want to feel each turn.',
    category: 'context-tokens',
    surfaces: ['status'],
    reaches: ['none'],
    copies: 199,
    mock: ['last turn $0.042 · session $1.87 · 38 turns'],
    prompt: `Build me a Claude Code mod called turn-cost-meter.

What it does: after each turn, compute its cost from input, output and cache tokens, and keep a running session total.
Where it shows: the status line.
Events to hook: request completion events with usage, turn end.
State: session total, turn count, last turn cost.
Look: "last turn $0.042 · session $1.87 · 38 turns". Session total turns amber above a budget I set with /budget.
Commands: /budget 5 sets a $5 warning line, /budget off clears it.
Limits: keep the price table in one constant at the top of the file with a comment saying where it came from; no network.
Done when: numbers update after each turn; tests check the cost math for a cached and an uncached request.
${FOOTER('turn-cost-meter')}`,
  },
  {
    slug: 'focus-timer',
    title: 'Focus Timer',
    tagline: 'A pomodoro band that counts down while you pair with Claude and nudges you to take a break.',
    description:
      'Start a 25 minute block with /focus. The band shows the countdown and how many turns you got through. When time is up, a toast tells you to stand up.',
    category: 'productivity',
    surfaces: ['band', 'toast', 'command'],
    reaches: ['none'],
    copies: 157,
    accent: '#B18CFF',
    mock: ['◷ focus 18:42 left · 6 turns this block', '> write tests for the parser'],
    prompt: `Build me a Claude Code mod called focus-timer.

What it does: a pomodoro timer inside Claude Code.
Where it shows: a band above the prompt while a block runs; a toast when it ends.
Events to hook: a 1 second timer while active, turn end to count turns, ui.render for the band.
State: end time, turns this block, completed blocks today.
Look: "◷ focus 18:42 left · 6 turns this block". Last minute blinks. Break mode uses a softer color and says "break 4:10".
Commands: /focus [minutes] starts (default 25), /focus stop, /focus stats shows blocks today.
Limits: no network, no files.
Done when: /focus 1 counts down and fires one toast at zero; test the time formatting and state transitions.
${FOOTER('focus-timer')}`,
  },
  {
    slug: 'todo-harvester',
    title: 'TODO Harvester',
    tagline: 'Collects every TODO and FIXME Claude adds or touches, in a pane you can click through.',
    description:
      'Watches file edits and pulls out TODO, FIXME and HACK comments in changed lines. The pane groups them by file so nothing Claude leaves behind gets lost.',
    category: 'workflow',
    surfaces: ['pane', 'command'],
    reaches: ['files'],
    copies: 133,
    mock: ['TODOs this session · 4', '  src/api.ts:42   TODO handle 429', '  src/db.ts:17    FIXME pool size', '  lib/util.ts:9   HACK remove'],
    prompt: `Build me a Claude Code mod called todo-harvester.

What it does: after every Edit or Write tool call, scan the changed lines for TODO, FIXME and HACK comments and keep a list for this session.
Where it shows: a pane titled "TODOs" with a count.
Events to hook: tool result events for Edit, Write and MultiEdit; ui.render for the pane.
State: a map of file -> list of {line, tag, text}; drop entries whose line no longer contains the tag.
Look: grouped by file, each row "line  TAG  text", TAG colored (TODO yellow, FIXME red, HACK purple). Empty state: "Clean so far".
Commands: /todos toggles the pane, /todos ask sends a prompt to Claude asking it to resolve the list.
Limits: only read files Claude edited; no network.
Done when: an edit that adds "// TODO x" shows up in the pane within the same turn; test the comment parser on JS, Python and SQL comment styles.
${FOOTER('todo-harvester')}`,
  },
  {
    slug: 'branch-weather',
    title: 'Branch Weather',
    tagline: 'Your git status as a tiny forecast in the status line: sunny, cloudy or stormy.',
    description:
      'Summarizes uncommitted changes, ahead/behind counts and merge conflicts as a one glance weather report. Silly, and weirdly effective.',
    category: 'fun-games',
    surfaces: ['status'],
    reaches: ['processes'],
    copies: 221,
    accent: '#5CC8FF',
    mock: ['⛅ main · 3 files changed · ↑2 ↓0'],
    prompt: `Build me a Claude Code mod called branch-weather.

What it does: show git status as weather.
Where it shows: the status line.
Events to hook: session start, turn end, and a 20 second timer.
State: the last status, so it only redraws when something changed.
Look: ☀ clean and in sync, ⛅ uncommitted changes, 🌧 behind remote, ⛈ merge conflicts. Then "branch · N files changed · ↑ahead ↓behind".
Limits: run only "git status --porcelain=v2 --branch"; no network fetches; show "no repo" outside git.
Done when: editing a file flips sun to cloud within 20s; test the porcelain parser on 4 sample outputs.
${FOOTER('branch-weather')}`,
  },
  {
    slug: 'explain-this-edit',
    title: 'Explain This Edit',
    tagline: 'A /why command that explains Claude\'s last file edit in plain words, without a full turn.',
    description:
      'Runs a small side model call on the last diff and prints a three line explanation: what changed, why, and what to check. Good for reviewing as you go.',
    category: 'workflow',
    surfaces: ['command'],
    reaches: ['model'],
    copies: 176,
    mock: ['> /why', '  Changed: retry loop in fetchUser()', '  Why: 429s were bubbling up', '  Check: max 3 retries, backoff 2^n'],
    prompt: `Build me a Claude Code mod called explain-this-edit.

What it does: a /why command that explains the most recent file edit Claude made.
Where it shows: the command's text reply.
Events to hook: tool result events for Edit/Write to remember the last diff; register the /why command.
State: the last diff (file path, old and new text), capped at 8k characters.
Look: three lines, "Changed:", "Why:", "Check:". If there is no edit yet, say so.
Limits: one small model call per /why using the mods model API with a cheap model; never send more than the stored diff.
Done when: after an edit, /why answers in under 5 seconds; test that the stored diff is truncated correctly.
${FOOTER('explain-this-edit')}`,
  },
  {
    slug: 'test-runner-pane',
    title: 'Test Runner Pane',
    tagline: 'Re-runs the tests touched by Claude\'s edits and shows pass/fail in a pane.',
    description:
      'Detects your test runner, finds tests related to the files Claude changed and runs only those after each turn. Red rows are clickable to send the failure back to Claude.',
    category: 'workflow',
    surfaces: ['pane', 'command'],
    reaches: ['files', 'processes'],
    featured: true,
    copies: 498,
    accent: '#5CE1A0',
    mock: ['Tests · 14 passed · 1 failed', '  ✓ auth/session.test.ts', '  ✗ auth/refresh.test.ts  expected 200', '  [ Send failure to Claude ]'],
    prompt: `Build me a Claude Code mod called test-runner-pane.

What it does: after each turn with file edits, run the tests related to the changed files and show results.
Where it shows: a pane titled "Tests".
Events to hook: tool results for edits to collect changed files, turn end to run, ui.render for the pane.
State: changed files this turn, last results per test file.
Look: summary line "14 passed · 1 failed", then one row per test file with ✓/✗ and the first failure message. A button "Send failure to Claude" submits a prompt with the failure output.
Commands: /tests toggles the pane, /tests all runs the full suite.
Limits: detect the runner from package.json or pyproject (vitest, jest, pytest); run with a 2 minute timeout; never run if no runner is found.
Done when: breaking a test makes a red row appear after the turn; test the related-test lookup (foo.ts -> foo.test.ts, tests/test_foo.py).
${FOOTER('test-runner-pane')}`,
  },
  {
    slug: 'quiet-hours',
    title: 'Quiet Hours',
    tagline: 'Blocks deploys, pushes to main and prod migrations outside the hours you set.',
    description:
      'A policy guard for people who ship from the terminal. Outside your working window it refuses risky commands with a clear reason Claude can read.',
    category: 'safety',
    surfaces: ['guard', 'status'],
    reaches: ['none'],
    copies: 118,
    mock: ['🌙 quiet hours until 09:00', '✗ blocked: git push origin main', '  reason: outside 09:00-18:00 Mon-Fri'],
    prompt: `Build me a Claude Code mod called quiet-hours.

What it does: outside a configured time window, refuse Bash commands that deploy or push to protected branches.
Where it shows: a status line "🌙 quiet hours until 09:00" while active; refusals appear as the tool result Claude reads.
Events to hook: tool.call for Bash.
State: none beyond config.
Look: refusal text: "Blocked by quiet-hours: <command>. Allowed 09:00-18:00 Mon-Fri."
Limits: config via plugin userConfig (window, days, patterns). Default patterns: git push to main/master, vercel --prod, fly deploy, kubectl apply, prisma migrate deploy. No network.
Done when: at 23:00 a push to main is refused and a push to a feature branch is not; test the time window logic across midnight and the pattern list.
${FOOTER('quiet-hours')}`,
  },
  {
    slug: 'prompt-time-machine',
    title: 'Prompt Time Machine',
    tagline: 'Search every prompt you sent this week and resend one with a keystroke.',
    description:
      'Keeps a local history of your prompts across sessions. /history opens a searchable pane; pick one to drop it back in the prompt box.',
    category: 'productivity',
    surfaces: ['pane', 'command'],
    reaches: ['files'],
    copies: 264,
    accent: '#FF8A5C',
    mock: ['History · "migration"', '  2d  write a migration for the likes table', '  4d  why does the migration fail on CI', '  ↵ to reuse'],
    prompt: `Build me a Claude Code mod called prompt-time-machine.

What it does: save every prompt I submit with a timestamp and project path, and let me search and reuse them.
Where it shows: a pane opened by /history with a search field and a result list.
Events to hook: prompt submit to record; register /history; ui.render for the pane.
State: history file at ~/.claude/prompt-history.jsonl, last 2,000 entries; in-memory index while the pane is open.
Look: search box on top, rows "age  first 80 chars", current project first. Enter puts the prompt into the input box, it does not send it.
Limits: only write to that one file; skip prompts that look like secrets (long base64 or "sk-" prefixes).
Done when: a prompt from yesterday is found by a word in it and lands in the input box; test the secret filter and the search ranking.
${FOOTER('prompt-time-machine')}`,
  },
]

export const SEED_MODS: Mod[] = SEEDS.map((s, i) => ({
  id: `seed-${i + 1}`,
  slug: s.slug,
  title: s.title,
  tagline: s.tagline,
  descriptionMd: s.description,
  promptMd: s.prompt,
  category: CATEGORIES.find(c => c.slug === s.category) ?? null,
  surfaces: s.surfaces,
  reaches: s.reaches,
  previewUrl: null,
  posterUrl: null,
  mediaType: null,
  repoUrl: null,
  installCmd: null,
  minCcVersion: '2.1.287',
  status: 'published',
  reviewNote: null,
  isFeatured: !!s.featured,
  copyCount: s.copies,
  likeCount: Math.round(s.copies / 6),
  publishedAt: new Date(Date.UTC(2026, 9, 5 - i)).toISOString(),
  author: AUTHOR,
  mock: { lines: s.mock, accent: s.accent },
}))
