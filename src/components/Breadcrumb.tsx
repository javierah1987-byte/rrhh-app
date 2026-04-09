'use client'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const LABELS: Record<string, string> = {
  admin: 'Admin', empleado: 'Mi portal',
  empleados: 'Empleados', horarios: 'Horarios',
  'control-horas': 'Control de horas', evaluaciones: 'Evaluaciones',
  vacaciones: 'Solicitudes', bajas: 'Bajas',
  'solicitudes-documentos': 'Petición docs',
  nominas: 'Nóminas', documentos: 'Documentos', informes: 'Informes',
  mensajes: 'Mensajes', avisos: 'Avisos', recordatorios: 'Recordatorios',
  festivos: 'Festivos', calendario: 'Calendario',
  solicitudes: 'Solicitudes', fichaje: 'Fichaje', perfil: 'Mi perfil',
  'solicitar-documentos': 'Pedir documentos', notificaciones: 'Notificaciones',
  nuevo: 'Nuevo',
}

function BreadcrumbComponent({ employeeName }: { employeeName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 1) return null

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(seg)
    const label = isUUID ? (employeeName || 'Ficha') : (LABELS[seg] || seg)
    return { href, label }
  })

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4 animate-fade-in">
      <button onClick={() => router.push(crumbs[0].href)}
        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <Home className="w-3 h-3"/><span>{crumbs[0].label}</span>
      </button>
      {crumbs.slice(1).map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 flex-shrink-0"/>
          {i === crumbs.length - 2
            ? <span className="font-semibold text-slate-700 dark:text-slate-300">{crumb.label}</span>
            : <button onClick={() => router.push(crumb.href)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{crumb.label}</button>
          }
        </span>
      ))}
    </nav>
  )
}

export default BreadcrumbComponent
