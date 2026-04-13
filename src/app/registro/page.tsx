'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, Building2, User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'

export default function RegistroPage(){
  const router=useRouter()
  const [step,setStep]=useState(1)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  const [showPass,setShowPass]=useState(false)
  const [done,setDone]=useState(false)
  const [form,setForm]=useState({nombre_empresa:'',cif:'',nombre_admin:'',email:'',password:'',confirma:''})
  const upd=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement>)=>{setForm(p=>({...p,[k]:e.target.value}));setError('')}

  function check1(){if(!form.nombre_empresa.trim())return'El nombre de empresa es obligatorio';return''}
  function check2(){
    if(!form.nombre_admin.trim())return'Tu nombre es obligatorio'
    if(!form.email.includes('@'))return'Email no válido'
    if(form.password.length<6)return'Mínimo 6 caracteres'
    if(form.password!==form.confirma)return'Las contraseñas no coinciden'
    return''
  }
  function siguiente(){const e=check1();if(e){setError(e);return}setStep(2)}
  async function registrar(){
    const e=check2();if(e){setError(e);return}
    setLoading(true);setError('')
    try{
      const resp=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/registrar-empresa',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({nombre_empresa:form.nombre_empresa.trim(),cif:form.cif||null,nombre_admin:form.nombre_admin.trim(),email:form.email.toLowerCase().trim(),password:form.password}),
      })
      const data=await resp.json()
      if(!resp.ok||data.error){setError(data.error||'Error');setLoading(false);return}
      setDone(true);setTimeout(()=>router.push('/'),3000)
    }catch(ex:any){setError(ex.message||'Error de conexión')}
    setLoading(false)
  }

  if(done)return(
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600"/></div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">¡Todo listo!</h2>
        <p className="text-slate-500 mb-6">Tu empresa <strong>{form.nombre_empresa}</strong> ha sido creada. Redirigiendo…</p>
        <div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600 mx-auto"/>
      </div>
    </div>
  )

  return(
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><span className="text-white font-black text-lg">N</span></div>
          <div><p className="font-black text-xl text-slate-900 dark:text-slate-100 leading-none">Nexo HR</p><p className="text-xs text-slate-400">by Tryvor</p></div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            {[1,2].map(s=>(
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 "+(step>=s?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-400')}>
                  {step>s?<CheckCircle className="w-4 h-4"/>:s}
                </div>
                <div className={"text-xs font-medium "+(step>=s?'text-indigo-600':'text-slate-400')}>{s===1?'Tu empresa':'Tu cuenta'}</div>
                {s<2&&<div className={"flex-1 h-0.5 rounded-full ml-2 "+(step>s?'bg-indigo-600':'bg-slate-100 dark:bg-slate-700')}/>}
              </div>
            ))}
          </div>
          {error&&<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl mb-4 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}</div>}
          {step===1&&(
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Datos de tu empresa</h2><p className="text-sm text-slate-400">Gratis · Sin tarjeta</p></div>
              <div><label className="label">Nombre *</label><div className="relative mt-1"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={form.nombre_empresa} onChange={upd('nombre_empresa')} placeholder="Acme S.L." className="input pl-9 w-full" onKeyDown={e=>e.key==='Enter'&&siguiente()} autoFocus/></div></div>
              <div><label className="label">CIF <span className="font-normal text-slate-400">(opcional)</span></label><input value={form.cif} onChange={upd('cif')} placeholder="B12345678" className="input w-full mt-1"/></div>
              <button onClick={siguiente} className="btn-primary w-full py-3 flex items-center justify-center gap-2">Continuar <ArrowRight className="w-4 h-4"/></button>
              <p className="text-center text-sm text-slate-400">¿Ya tienes cuenta? <a href="/" className="text-indigo-600 hover:underline font-medium">Inicia sesión</a></p>
            </div>
          )}
          {step===2&&(
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Tu cuenta de admin</h2><p className="text-sm text-slate-400">Para <strong>{form.nombre_empresa}</strong></p></div>
              <div><label className="label">Nombre completo *</label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={form.nombre_admin} onChange={upd('nombre_admin')} placeholder="Ana García" className="input pl-9 w-full" autoFocus/></div></div>
              <div><label className="label">Email *</label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type="email" value={form.email} onChange={upd('email')} placeholder="ana@empresa.com" className="input pl-9 w-full"/></div></div>
              <div><label className="label">Contraseña *</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type={showPass?'text':'password'} value={form.password} onChange={upd('password')} placeholder="Mínimo 6 caracteres" className="input pl-9 pr-10 w-full"/><button type="button" onClick={()=>setShowPass(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
              <div><label className="label">Confirmar *</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type={showPass?'text':'password'} value={form.confirma} onChange={upd('confirma')} placeholder="Repite" className={"input pl-9 w-full "+(form.confirma&&form.password!==form.confirma?'border-red-300':'')} onKeyDown={e=>e.key==='Enter'&&registrar()}/></div></div>
              <div className="flex gap-2"><button onClick={()=>setStep(1)} className="btn-secondary px-4">Atrás</button><button onClick={registrar} disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50">{loading?<><Loader2 className="w-4 h-4 animate-spin"/>Creando…</>:<><CheckCircle className="w-4 h-4"/>Crear empresa</>}</button></div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">{[{i:'✅',l:'Gratis'},{i:'🔒',l:'RGPD'},{i:'⚡',l:'2 minutos'}].map(x=>(<div key={x.l} className="text-center"><div className="text-xl mb-1">{x.i}</div><p className="text-xs text-slate-400">{x.l}</p></div>))}</div>
      </div>
    </div>
  )
}