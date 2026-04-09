'use client'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const LABELS: Record<string, string> = {
  admin: 'Admin',
  empleados: 'Empleados',
  horarios: 'Horarios',
  'control-horas': 'Control de horas',
  evaluaciones: 'Evaluaciones',
  vacaciones: 'Solicitudes',
  bajas: 'Bajas',
  'solicitudes-documentos': 'Petición docs',
  nominas: 'Nóminas',
  documentos: 'Documentos',
  informes: 'Informes',
  mensajes: 'Mensajes',
  avisos: 'Avisos',
  recordatorios: 'Recordatorios',
  festivos: 'Festivos',
  calendario: 'Calendario',
  empleado: 'Mi portal',
  fichaje: 'Fichaje',
  solicitudes: 'Solicitudes',
  perfil: 'Mi perfil',
  notificaciones: 'Notificaciones',
  'solicitar-documentos': 'Pedir documentos',
  nuevo: 'Nuevo',
}

export function Breadcrumb({ customLabels }: { customLabels?: Record<string, string> }) {
  const router = useRouter()
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = customLabels?.[seg] || LABELS[seg] || seg
    const isLast = i === segments.length - 1
    const isId = /^[0-9a-f-]{20,}$/.test(seg)
    return { href, label: isId ? (customLabels?.[seg] || 'Detalle') : label, isLast }
  })

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
      <button onClick={() => router.push(crumbs[0].href.startsWith('/admin') ? '/admin' : '/empleado')}
        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <Home className="w-3.5 h-3.5"/>
      </button>
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 opacity-40"/>
          {c.isLast ? (
            <span className="font-semibold text-slate-600 dark:text-slate-300">{c.label}</span>
          ) : (
            <button onClick={() => router.push(c.href)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
              {c.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  )
}
