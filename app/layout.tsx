import type { Metadata } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const instrument = Instrument_Serif({ variable: '--font-instrument', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] })
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Modprompts: prompts that build Claude Code mods', template: '%s · Modprompts' },
  description:
    'A gallery of Claude Code mods. Each one comes with a prompt you paste into Claude Code to build it yourself, your way.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
