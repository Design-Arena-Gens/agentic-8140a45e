import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'News Video Agent - Automated Social Media Posts',
  description: 'Automatically fetch news, generate videos, and post to social media',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
