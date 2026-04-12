import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || 'nexohr-cron-2024'
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const resp = await fetch(`${url}/functions/v1/recordatorios-automaticos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ trigger: 'vercel-cron', fecha: new Date().toISOString() }),
    })
    const data = await resp.json()
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), resultados: data.resultados })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}