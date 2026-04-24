// @ts-nocheck
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

// Mapa: ruta → feature necesaria
const ROUTE_FEATURE_MAP = {
  '/admin/control-horas':          'control_horario',
  '/admin/whois':                  'control_horario',
  '/admin/horarios':               'turnos',
  '/admin/correcciones':           'correcciones',
  '/admin/bolsa-horas':            'bolsa_horas',
  '/admin/empleados':              'empleados',
  '/admin/evaluaciones':           'evaluaciones',
  '/admin/onboarding':             'onboarding',
  '/admin/organigrama':            'organigrama',
  '/admin/analytics':              'people_analytics',
  '/admin/reclutamiento':          'reclutamiento',
  '/admin/vacaciones':             'vacaciones',
  '/admin/bajas':                  'bajas',
  '/admin/calendario':             'vacaciones',
  '/admin/festivos':               'vacaciones',
  '/admin/nominas':                'nominas',
  '/admin/gastos':                 'gastos',
  '/admin/documentos':             'documentos',
  '/admin/solicitudes-documentos': 'documentos',
  '/admin/firmas':                 'firmas',
  '/admin/informes':               'informes',
  '/admin/email-queue':            'avisos',
  '/admin/okr':                    'okr',
  '/admin/avisos':                 'avisos',
  '/admin/encuestas':              'clima_laboral',
  '/admin/mensajes':               'mensajes',
  '/admin/recordatorios':          'recordatorios',
  '/admin/rgpd':                   'rgpd',
  '/admin/denuncias':              'denuncias',
  '/admin/formacion':              'formacion',
  '/admin/reservas':               'reserva_espacios',
  '/kiosko':                       'kiosko',
}

export async function middleware(req) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Solo proteger rutas del admin y kiosko
  const needsCheck = pathname.startsWith('/admin/') || pathname.startsWith('/kiosko')
  if (!needsCheck) return res

  // Encontrar la feature necesaria para esta ruta
  const requiredFeature = Object.entries(ROUTE_FEATURE_MAP).find(
    ([route]) => pathname === route || pathname.startsWith(route + '/')
  )?.[1]

  // Si la ruta no requiere una feature específica, pasar
  if (!requiredFeature) return res

  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return res // no session → el layout redirigirá al login

    // Obtener el empleado y su empresa
    const { data: emp } = await supabase
      .from('empleados')
      .select('empresa_id, rol')
      .eq('user_id', session.user.id)
      .eq('estado', 'activo')
      .single()

    if (!emp?.empresa_id) return res // sin empresa → dejar pasar (superadmin)

    // Obtener el plan de la empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('plan')
      .eq('id', emp.empresa_id)
      .single()

    const plan = empresa?.plan || 'starter'

    // Verificar si tiene la feature (plan_features tiene RLS abierta para lectura)
    const { data: pf } = await supabase
      .from('plan_features')
      .select('feature_id')
      .eq('plan_id', plan)
      .eq('feature_id', requiredFeature)
      .maybeSingle()

    // Verificar override de empresa
    const { data: override } = await supabase
      .from('empresas_features_override')
      .select('activa')
      .eq('empresa_id', emp.empresa_id)
      .eq('feature_id', requiredFeature)
      .maybeSingle()

    const inPlan = pf != null
    const hasAccess = override != null ? override.activa === true : inPlan

    if (!hasAccess) {
      // Redirigir a la página de bloqueo
      const url = req.nextUrl.clone()
      url.pathname = '/bloqueado-feature'
      url.searchParams.set('feature', requiredFeature)
      url.searchParams.set('plan', plan)
      return NextResponse.redirect(url)
    }
  } catch (e) {
    // En caso de error técnico, dejar pasar (no bloquear por error)
    console.error('[middleware] error:', e)
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/kiosko/:path*'],
}
