import { z } from 'zod'

export const SURFACES = ['pane', 'band', 'status', 'toast', 'spinner', 'command', 'tool', 'guard', 'restyle'] as const
export type Surface = (typeof SURFACES)[number]

export const SURFACE_LABELS: Record<Surface, string> = {
  pane: 'Pane',
  band: 'Band',
  status: 'Status line',
  toast: 'Toast',
  spinner: 'Spinner',
  command: 'Command',
  tool: 'Model tool',
  guard: 'Guard',
  restyle: 'Restyle',
}

export const REACHES = ['files', 'network', 'processes', 'model', 'none'] as const
export type Reach = (typeof REACHES)[number]

const repoUrl = z
  .string()
  .url()
  .refine(u => /^https:\/\/(github\.com|gitlab\.com)\//.test(u), 'GitHub or GitLab only')

export const modInput = z.object({
  title: z.string().trim().min(3).max(60),
  tagline: z.string().trim().min(10).max(120),
  descriptionMd: z.string().max(5000).optional().default(''),
  categorySlug: z.string().min(1),
  surfaces: z.array(z.enum(SURFACES)).min(1),
  promptMd: z.string().trim().min(80).max(20000),
  reaches: z.array(z.enum(REACHES)).min(1),
  repoUrl: z.union([repoUrl, z.literal('')]),
  installCmd: z
    .string()
    .trim()
    .max(200)
    .regex(/^$|^(\/plugin|claude plugin) install [\w.-]+@[\w.-]+$/, 'Use /plugin install name@marketplace'),
  minCcVersion: z.string().regex(/^$|^\d+\.\d+\.\d+$/).optional().default(''),
})
export type ModInput = z.infer<typeof modInput>
