import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export type Rol = 'admin' | 'empleado'
export type EstadoEmpleado = 'activo' | 'baja' | 'vacaciones'
export type TipoFichaje = 'entrada' | 'pausa_inicio' | 'pausa_fin' | 'salida'
export type TipoSolicitud = 'vacaciones' | 'asuntos_propios' | 'permiso_sin_sueldo' | 'cambio_turno' | 'teletrabajo'
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'
export type TipoBaja = 'enfermedad_comun' | 'accidente_laboral' | 'maternidad_paternidad' | 'accidente_no_laboral' | 'cuidado_familiar'
export interface Empleado { id: string; user_id: string; nombre: string; email: string; rol: Rol; departamento: string; puesto: string; jornada_horas: number; tipo_contrato: string; fecha_alta: string; estado: EstadoEmpleado; avatar_color: string; created_at: string }
export interface Fichaje { id: string; empleado_id: string; tipo: TipoFichaje; timestamp: string; fecha: string }
export interface Solicitud { id: string; empleado_id: string; tipo: TipoSolicitud; fecha_inicio: string; fecha_fin: string; comentario: string | null; estado: EstadoSolicitud; created_at: string; empleados?: Pick<Empleado, 'nombre' | 'avatar_color'> }
export interface Baja { id: string; empleado_id: string; tipo: TipoBaja; fecha_inicio: string; fecha_fin_prevista: string | null; fecha_alta: string | null; numero_parte: string | null; observaciones: string | null; activa: boolean; created_at: string; empleados?: Pick<Empleado, 'nombre' | 'avatar_color' | 'departamento'> }
export interface Nomina { id: string; empleado_id: string; mes: number; anio: number; salario_base: number; complementos: number; irpf_pct: number; ss_pct: number; liquido: number; created_at: string }
export interface Aviso { id: string; titulo: string; contenido: string | null; fecha: string; activo: boolean }
