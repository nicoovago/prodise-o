import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prode 2026 🏆',
  description: 'Prode del Mundial 2026 entre amigos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
