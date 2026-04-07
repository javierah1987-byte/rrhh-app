'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Building2, Clock, Calendar, Palmtree, HeartPulse, Users, BarChart3, LogOut } from 'lucide-react'
const NAV=[{href:'/admin',label:'Fichaje',icon:Clock},{href:'/admin/horarios',label:'Horarios',icon:Calendar},{href:'/admin/vacaciones',label:'Vacaciones',icon:Palmtree},{href:'/admin/bajas',label:'Bajas',icon:HeartPulse},{href:'/admin/empleados',label:'Empleados',icon:Users},{href:'/admin/informes',label:'Informes',icon:BarChart3}]
export default function AdminLayout({children}:{{children:React.ReactNode}}){
  const router=useRouter(),pathname=usePathname()
  useEffect(()=>{supabase.auth.getUser().then(async({data})=>{if(!data.user){router.push('/login');return};const{data:emp}=await supabase.from('empleados').select('*').eq('user_id',data.user.id).single();if(!emp||emp.rol!=='admin'){router.push('/login');return}})},[router])
  async function logout(){await supabase.auth.signOut();router.push('/login')}
  return(<div className="min-h-screen bg-gray-50"><header className="bg-white border-b border-gray-200 sticky top-0 z-40"><div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6"><Link href="/admin" className="flex items-center gap-2 mr-4"><div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"><Building2 className="w4 h-4 text-white" /></div><span className="font-semibold text-gray-900 text-sm">ACME RRHH</span></Link><nav className="flex items-center gap-1 flex-1 overflow-x-auto">{NAV.map(({href,label,icon:Icon})=>{const active=pathname===href;return(<Link key={href} href={href} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}`}><Icon className="w-4 h-4" />{label}</Link>)})}</nav><button onClick={logout} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 ml-auto"><LogOut className="w4 h-4" />Salir</button></div></header><main className="max-w-7xl mx-auto px-4 py-6">{children}</main></div>)
}
