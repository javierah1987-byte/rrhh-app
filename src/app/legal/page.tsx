import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Aviso Legal y Privacidad' }

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 space-y-8">
          <div>
            <Link href="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 block">← Volver al inicio</Link>
            <h1 className="page-title mb-1">Aviso Legal y Política de Privacidad</h1>
            <p className="text-sm text-slate-400">Última actualización: Abril 2026</p>
          </div>

          <section aria-labelledby="responsable">
            <h2 id="responsable" className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Responsable del tratamiento</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              El responsable del tratamiento de los datos personales recogidos en esta aplicación es la empresa titular de la cuenta de administración. Los datos se alojan en servidores de Supabase (Supabase Inc.) ubicados en la Unión Europea, bajo el marco del RGPD.
            </p>
          </section>

          <section aria-labelledby="datos">
            <h2 id="datos" className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Datos que se recogen</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">Esta aplicación recoge y trata los siguientes datos de los empleados:</p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-2">
              <li>Datos identificativos: nombre, email, DNI/NIE, fecha de nacimiento</li>
              <li>Datos de contacto: teléfono, dirección, contacto de emergencia</li>
              <li>Datos laborales: puesto, departamento, tipo de contrato, fecha de alta, salario</li>
              <li>Datos bancarios: número de cuenta IBAN para el pago de nóminas</li>
              <li>Registros de actividad: fichajes de entrada/salida, solicitudes de ausencia, bajas</li>
            </ul>
          </section>

          <section aria-labelledby="finalidad">
            <h2 id="finalidad" className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Finalidad y base jurídica</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Los datos se tratan exclusivamente para la gestión de la relación laboral (Art. 6.1.b RGPD — ejecución de contrato) y para el cumplimiento de obligaciones legales en materia laboral y fiscal (Art. 6.1.c RGPD). No se utilizan para elaborar perfiles comerciales ni se ceden a terceros salvo obligación legal.
            </p>
          </section>

          <section aria-labelledby="derechos">
            <h2 id="derechos" className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Tus derechos</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Como interesado tienes derecho a acceder a tus datos, rectificarlos, suprimirlos, oponerte al tratamiento y solicitar la portabilidad. Para ejercer estos derechos puedes contactar con el departamento de RRHH de tu empresa. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
            </p>
          </section>

          <section aria-labelledby="seguridad">
            <h2 id="seguridad" className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Seguridad</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Los datos están protegidos mediante autenticación segura (JWT), cifrado en tránsito (HTTPS/TLS 1.3) y políticas de acceso por filas (Row Level Security) que garantizan que cada empleado solo puede ver sus propios datos. Las nóminas en PDF se sirven únicamente mediante enlaces firmados con caducidad de 60 segundos.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Nexo HR es una plataforma de gestión interna de RRHH. El uso de la aplicación implica la aceptación de esta política. Para cualquier consulta sobre el tratamiento de sus datos, contacte con el responsable de RRHH de su organización.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}