'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Home, FileText, FolderOpen, User } from 'lucide-react'
const NAV = [{href:'/empleado',label:'Inicio',icon:Home},{href:'/empleado/solicitudes',label:'Solicitudes',icon:FileText},{href:'/empleado/documentos',label:'Documentos',icon:FolderOpen},{href:'/empleado/perfil',label:'Perfil',icon:User}]
export default function EmpleadoLayout({children}:{{children:React.ReactNode}}){
  const router=useRouter(),pathname=usePathname()
  useEffect(()=>{supabase.auth.getUser().then(async({data})=>{if(!data.user){router.push('/login');return};const{data:emp}=await supabase.from('empleados').select('*').eq('user_id',data.user.id).single();if(!emp){router.push('/login');return};if(emp.rol==='admin'){router.push('/admin');return}})},[router])
  return(<div className="min-h-screen bg-gray-50 flex justify-center"><div className="w-full max-w-[420px] min-h-screen bg-white relative flex flex-col shadow-sm"><div className="flex-1 overflow-y-auto pb-20">{children}</div><nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 z-40"><div className="flex">{NAV.map(({ href, label, icon: Icon })=>{const active=pathname===href;return(<Link key={href} href={href} className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active?'text-indigo-600':'text-gray-400 hover:text-gray-600'}`}><Icon className="w5 h-5" /><span className="text-[10px] font-medium">{label}</span></Link>)}})</div></nav></div></div>)
}
