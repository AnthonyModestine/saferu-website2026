import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { TrackPageView } from "@/components/track-page-view"
import { MemberFeedbackPrompt } from "@/components/member-feedback-prompt"
import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadContentMeta } from "@/lib/content-meta-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"
import './globals.css'

export const metadata: Metadata = {
  title: 'SaferU - Public Safety Content & Communications Platform',
  description: 'Your trusted partner in public safety communications. Ready-to-share safety content and Press Center for confident, professional messaging.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await Promise.all([loadCmsAdditions(), loadContentMeta(), loadVisibility()])
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <TrackPageView />
        {children}
        <MemberFeedbackPrompt />
        <Analytics />
      </body>
    </html>
  )
}
