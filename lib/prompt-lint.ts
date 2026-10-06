export const SECTIONS = [
  'What it does',
  'Where it shows',
  'Events to hook',
  'State',
  'Look',
  'Limits',
  'Done when',
] as const

export function missingSections(prompt: string): string[] {
  const p = prompt.toLowerCase()
  return SECTIONS.filter(s => !p.includes(s.toLowerCase() + ':'))
}

export const PROMPT_TEMPLATE = `Build me a Claude Code mod called <name>.

What it does: <one paragraph, user-visible behavior>
Where it shows: <pane | band above prompt | status line | toast | command ...>
Events to hook: <e.g. tool.call, ui.render {component:'Spinner'}, turn.end>
State: <what it remembers between hooks>
Look: <layout, colors, refresh rate, empty state>
Commands: </name args -> behavior>
Limits: <what it must not do: no network, no file writes outside X>
Done when: <how I check it works, plus a test with the mods test kit>

Use the plugin-authoring skill. Put it in ./<name>/ as a plugin with
.claude-plugin/plugin.json, hooks/hooks.json and hooks/register.ts,
then load it with /reload-plugins.`
