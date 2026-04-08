'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react'
export default function LoginPage(){
  const router=useRouter()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  async function handleLogin(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError('')
    const{data,error:authError}=await supabase.auth.signInWithPassword({email,password})
    if(authError||!data.user){setError('Email o contraseÃ±a incorrectos');setLoading(false);return}
    const{data:emp}=await supabase.from('empleados').select('rol').eq('user_id',data.user.id).single()
    if(emp?.rol==='admin')router.push('/admin');else router.push('/empleado')
  }
  return(<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4"><div className="w-full max-w-md"><div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg"><Building2 className="w-8 h-8 text-white" /></div><h1 className="text-2xl font-bold text-gray-900">ACME RRHH</h1><p className="text-gray-500 text-sm mt-1">Sistema de gestiÃ³n de recursos humanos</p></div><div className="card p-8"><form onSubmit={handleLogin} className="space-y-5"><div><label className="label">Correo electrÃ³nico</label><div className="relative"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input pl-9" placeholder="tu@empresa.com" required /></div></div><div><label className="label">ContraseÃ±a</label><div className="relative"><Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input pl-9" required /></div></div>{error&&<div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}<button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading?'Entrandoâ¦':'Entrar'}</button></form></div><div className="mt-6 card p-4"><p className="text-xs font-medium text-gray-500 mb-3">Usuarios de prueba</p><div className="space-y-1.5">{[{email:'admin@acme.com',pass:'admin123',rol:'Admin'},{email:'ana@acme.com',pass:'1234',rol:'Empleada'},{email:'luis@acme.com',pass:'1234',rol:'Empleado (baja)'}].map(u=>(<button key={u.email} type="button" onClick={() => { setEmail(u.email); setPassword(u.pass) }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"><span className="text-xs text-gray-700 font-medium">{u.email}</span><span className="text-xs text-gray-400 ml-2">/{u.pass}</span><span className="float-right text-xs text-indigo-600">{u.rol}</span></button>))}</div></div></div></div>)
}
