import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname
  if (!session && (pathname.startsWith('/admin') || pathname.startsWith('/empleado'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session && (pathname === '/login' || pathname === '/')) {
    const { data: emp } = await supabase.from('empleados').select('rol').eq('user_id', session.user.id).single()
    if (emp?.rol === 'admin') return NextResponse.redirect(new URL('/admin', req.url))
    return NextResponse.redirect(new URL('/empleado', req.url))
  }
  return res
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/empleado/:path*'],
}
