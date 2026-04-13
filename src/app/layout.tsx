import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PWARegister } from '@/components/pwa-register'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Nexo HR',
  description: 'Sistema de Gestión de Recursos Humanos',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Nexo HR' },
  openGraph: {
    title: 'Nexo HR',
    description: 'Portal de RRHH para tu equipo',
    type: 'website',
    locale: 'es_ES',
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('nexohr-dark')==='true'){document.documentElement.classList.add('dark')}}catch(e){}`
          }}
        />
      </head>
      <body>
        <PWARegister />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold">
          Saltar al contenido principal
        </a>
        {children}
      </body>
    </html>
  )
}
