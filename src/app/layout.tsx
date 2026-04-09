import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Nexo HR',
  description: 'Sistema de Gestión de Recursos Humanos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('nexohr-dark')==='true'){document.documentElement.classList.add('dark')}}catch(e){}`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
