import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'Nexo HR', template: '%s | Nexo HR' },
  description: 'Sistema de Gestión de Recursos Humanos',
  openGraph: {
    title: 'Nexo HR',
    description: 'Portal de RRHH para tu equipo',
    type: 'website',
    locale: 'es_ES',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
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
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold">
          Saltar al contenido principal
        </a>
        {children}
      </body>
    </html>
  )
}
