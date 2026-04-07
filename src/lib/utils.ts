import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
export const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
export const TIPOS_SOLICITUD: Record<string,string> = {vacaciones:'Vacaciones',asuntos_propios: 'Asuntos propios',permiso_sin_sueldo:'Permiso sin sueldo',cambio_turno:'Cambio de turno',teletrabajo:'Teletrabajo'}
export const TIPOS_BAJA: Record<string,string> = {enfermedad_comun:'Enfermedad común',accidente_laboral:'Accidente laboral',maternidad_paternidad:'Maternidad / Paternidad',accidente_no_laboral:'Accidente no laboral',cuidado_familiar:'Cuidado familiar'}
export function iniciales(nombre: string) { return nombre.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() }
export function diasEntre(inicio: string, fin: string) { return differenceInCalendarDays(parseISO(fin),parseISO(inicio))+1 }
export function formatFecha(fecha: string) { return format(parseISO(fecha),'d MMM yyyy',{locale:es}) }
export function formatHora(ts: string) { return format(parseISO(ts),'HH:mm') }
export function minutosAHHMM(minutos: number) {
  const h = Math.floor(Math.abs(minutos)/60)
  const m = Math.abs(minutos)%60
  return `${minutos<0?'-':''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}
export function calcularMinutosTrabajados(fichajes: {tipo: string;timestamp: string}[]) {
  let total = 0, entradaTs: Date|null = null
  const sorted = [...fichajes].sort((a,b) => new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime())
  for(const f of sorted){
    const ts=new Date(f.timestamp)
    if(f.tipo==='entrada'||f.tipo==='pausa_fin')entradaTs=ts
    else if((f.tipo==='pausa_inicio'||f.tipo==='salida')&&entradaTs){total+=(ts.getTime()-entradaTs.getTime())/60000;entradaTs=null}
  }
  if(entradaTs)total+=(Date.now()-entradaTs.getTime())/60000
  return Math.floor(total)
}
export function estadoFichaje(fichajes: {tipo: string}[]) {
  if(!fichajes.length)return 'sin_fichar'
  const u=fichajes[fichajes.length-1].tipo
  if(u==='entrada'||u==='pausa_fin')return 'trabajando'
  if(u==='pausa_inicio')return 'pausa'
  if(u==='salida')return 'finalizado'
  return 'sin_fichar'
}
export const BADGE_ESTADO_EMPLEADO:Record<string,string>={activo:'bg-emerald-100 text-emerald-800',baja:'bg-red-100 text-red-800',vacaciones:'bg-blue-100 text-blue-800'}
export const BADVE_ESTADO_SOLICITUD:Record<string,string>={pendiente:'bg-amber-100 text-amber-800',aprobada:'bg-emerald-100 text-emerald-800',rechazada:'bg-red-100 text-red-800'}
export const BADGE_FICHAJE:Record<string,string>={trabajando:'bg-emerald-100 text-emerald-800',pausa:'bg-amber-100 text-amber-800',finalizado:'bg-gray-100 text-gray-700',sin_fichar:'bg-gray-100 text-gray-500'}
export const LABEL_FICHAJE:Record<string,string>={trabajando:'Trabajando',pausa:'En pausa',finalizado:'Finalizado',sin_fichar:'Sin fichar'}
