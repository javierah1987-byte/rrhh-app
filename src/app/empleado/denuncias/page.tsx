'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Shield, AlertTriangle, Send, Search, CheckCircle, Copy, Loader2, X } from 'lucide-react'

const CATEGORIAS: Record<string,{label:string;icon:string}> = {
  acoso_laboral:  {label:'Acoso laboral',icon:'🛡️'},
  acoso_sexual:   {label:'Acoso sexual',icon:'⚠️'},
  discriminacion: {label:'Discriminación',icon:'⚖️'},
  fraude:         {label:'Fraude o corrupción',icon:'💰'},
  corrupcion:     {label:'Corrupción',icon:'🔐'},
  seguridad:      {label:'Seguridad laboral',icon:'️🧰'},
  privacidad:     {label:'Privacidad de datos',icon:'🔒'},
  otros:          {label:'Otros',icon:'📝'},
}

export default function CanalDenunciasPage() {
  const [tab, setTab] = useState<'nueva'|'seguimiento'>('nueva')
  const [form, setForm] = useState({ categoria: '', descripcion: '', anonima: true, contacto_email: '' })
  const [saving, setSaving] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [codigoBusqueda, setCodigoBusqueda] = useState('')
  const [denuncia, setDenuncia] = useState<any>(null)
  const [buscando, setBuscando] = useState(false)

  async function enviar() {
    if (!form.categoria || !form.descripcion.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('denuncias').insert({
      categoria: form.categoria,
      descripcion: form.descripcion.trim(),
      anonima: form.anonima,
      contacto_email: form.anonima ? null : form.contacto_email || null,
    }).select('codigo_seguimiento').single()
    if (error) {
      alert('Error al enviar: ' + error.message)
    } else {
      setResultado(data)
    }
    setSaving(false)
  }

  async function buscar() {
    if (!codigoBusqueda.trim()) return
    setBuscando(true)
    const { data } = await supabase.from('denuncias')
      .select('codigo_seguimiento,categoria,estado,prioridad,created_at,anonima')
      .eq('codigo_seguimiento', codigoBusqueda.trim().toUpperCase())
      .maybeSingle()
    setDenuncia(data)
    setBuscando(false)
  }

  const ESTADO_LABEL: Record<string,{label:string;color:string}> = {
    recibida:          {label:'Recibida',color:'badge-amber'},
    en_investigacion:  {label:'En investigación',color:'bg-blue-100 text-blue-700'},
    resuelta:          {label:'Resuelta',color:'badge-green'},
    archivada:         {label:'Archivada',color:'bg-slate-100 text-slate-500'},
    desestimada:       {label:'Desestimada',color:'badge-red'},
  }

  return (
    <div className="p-4 pb-24 lg:pb-4 max-w-xl mx-auto">
      <Breadcrumb/>
      <div className="pt-2 mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500"/>Canal de denuncias
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Confidencial · Ley 2/2023 de protección al informante</p>
      </div>

      <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 mb-5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <strong>Confidencialidad garantizada.</strong> Tu identidad está protegida por la Ley 2/2023. Los administradores gestionan las denuncias con total discreción. En caso de emergencia, llama al <strong>112</strong>.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {[{k:'nueva',l:'Nueva denuncia'},{k:'seguimiento',l:'Consultar estado'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${tab===t.k?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'nueva' && !resultado && (
        <div className="space-y-4">
          <div>
            <label className="label mb-2 block">Categoría *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORIAS).map(([key, cat]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({...f, categoria: key}))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.categoria === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
                  <span className="text-base">{cat.icon}</span>
                  <p className={`text-xs font-semibold mt-1 ${form.categoria === key ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Descripción detallada *</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))}
              placeholder="Describe los hechos con el mayor detalle posible: fechas, personas involucradas, testigos, evidencias..."
              rows={5} className="input w-full resize-none mt-1"/>
            <p className="text-[10px] text-slate-400 mt-1">{form.descripcion.length} caracteres · Mínimo 50 recomendado</p>
          </div>

          <div className="card p-4 bg-slate-50 dark:bg-slate-700/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.anonima} onChange={e => setForm(f => ({...f, anonima: e.target.checked}))}
                className="mt-0.5 w-4 h-4 rounded accent-indigo-600"/>
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Denuncia anónima</span>
                <p className="text-xs text-slate-400 mt-0.5">Tu identidad no quedará registrada en el sistema</p>
              </div>
            </label>
            {!form.anonima && (
              <div className="mt-3">
                <label className="label">Email de contacto (opcional)</label>
                <input type="email" value={form.contacto_email} onChange={e => setForm(f => ({...f, contacto_email: e.target.value}))}
                  placeholder="para recibir actualizaciones" className="input mt-1"/>
              </div>
            )}
          </div>

          <button onClick={enviar} disabled={saving || !form.categoria || form.descripcion.length < 10}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Enviando…</> : <><Send className="w-4 h-4"/>Enviar denuncia</>}
          </button>
        </div>
      )}

      {resultado && (
        <div className="card p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-7 h-7 text-emerald-600"/>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">Denuncia recibida</h4>
          <p className="text-sm text-slate-500 mb-4">Guarda tu código de seguimiento para consultar el estado</p>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-400 mb-1">Código de seguimiento</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-2xl font-black text-indigo-600 tracking-widest">{resultado.codigo_seguimiento}</span>
              <button onClick={() => navigator.clipboard.writeText(resultado.codigo_seguimiento)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                <Copy className="w-4 h-4 text-slate-400"/>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400">El responsable tiene 7 días para acusar recibo y 90 días para resolver (Ley 2/2023)</p>
          <button onClick={() => { setResultado(null); setForm({ categoria:'', descripcion:'', anonima:true, contacto_email:'' }) }}
            className="btn-secondary mt-4 w-full">Nueva denuncia</button>
        </div>
      )}

      {tab === 'seguimiento' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={codigoBusqueda} onChange={e => setCodigoBusqueda(e.target.value.toUpperCase())}
              placeholder="Código de seguimiento (ej: AB12CD34)" className="input flex-1 font-mono uppercase"
              onKeyDown={e => e.key === 'Enter' && buscar()}/>
            <button onClick={buscar} disabled={buscando || !codigoBusqueda.trim()}
              className="btn-primary px-4 flex items-center gap-2 disabled:opacity-50">
              {buscando ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
            </button>
          </div>

          {denuncia === null && codigoBusqueda && !buscando && (
            <div className="card p-6 text-center">
              <X className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
              <p className="text-slate-500">No se encontró ninguna denuncia con ese código</p>
            </div>
          )}

          {denuncia && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{CATEGORIAS[denuncia.categoria]?.label}</h4>
                <span className={`badge text-xs ${ESTADO_LABEL[denuncia.estado]?.color}`}>
                  {ESTADO_LABEL[denuncia.estado]?.label}
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-500">
                <p>Código: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{denuncia.codigo_seguimiento}</span></p>
                <p>Enviada: {new Date(denuncia.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
                <p>Tipo: {denuncia.anonima ? 'Anónima' : 'Con datos de contacto'}</p>
              </div>
              <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300">
                El responsable de cumplimiento está gestionando tu denuncia con total confidencialidad.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}