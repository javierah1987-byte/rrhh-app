import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexo HR',
  description: 'Sistema de Gestión de Recursos Humanos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('nexohr-dark') === 'true') {
                  document.documentElement.classList.add('dark')
                }
              } catch(e){}
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
