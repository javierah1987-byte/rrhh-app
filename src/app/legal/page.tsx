import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aviso Legal y Política de Privacidad — Nexo HR',
  description: 'Información legal y política de privacidad de la plataforma Nexo HR conforme al RGPD.',
}

const SECCIONES = [
  {
    id: 'responsable',
    titulo: 'Responsable del tratamiento',
    contenido: `La plataforma Nexo HR es un sistema de gestión de recursos humanos de uso interno. El responsable del tratamiento de los datos personales recogidos es la empresa titular de la cuenta de administración, identificada en el contrato de trabajo y en la cláusula informativa entregada a cada empleado.

Los datos se alojan en servidores de Supabase Inc. ubicados en la Unión Europea (región eu-west-1, Irlanda), bajo el marco del RGPD y con acuerdo de encargado del tratamiento (DPA) firmado conforme al Artículo 28 del RGPD.`
  },
  {
    id: 'datos',
    titulo: 'Datos personales que se tratan',
    lista: [
      'Identificativos: nombre completo, DNI o NIE, fecha de nacimiento',
      'Contacto: email corporativo, teléfono, dirección postal',
      'Laborales: puesto, departamento, tipo de contrato, fecha de alta, salario base, registro de jornada (fichajes)',
      'Bancarios: número de cuenta IBAN para el abono de nóminas',
      'Documentales: nóminas en PDF, documentos adjuntos al expediente',
      'Comunicaciones: mensajes internos entre empleado y RRHH',
    ]
  },
  {
    id: 'finalidad',
    titulo: 'Finalidad y base jurídica',
    contenido: `Los datos se tratan exclusivamente para las siguientes finalidades, con sus respectivas bases jurídicas conforme al RGPD:

• Gestión de la relación laboral (Art. 6.1.b — ejecución del contrato de trabajo)
• Registro de jornada obligatorio por ley (Art. 6.1.c — RD-ley 8/2019)
• Gestión de nóminas y obligaciones fiscales y laborales (Art. 6.1.c — TGSS, AEAT)
• Gestión de bajas médicas (Art. 9.2.b — obligaciones en materia de Derecho laboral)
• Comunicaciones internas de RRHH (Art. 6.1.f — interés legítimo)

Los datos no se utilizan para elaborar perfiles comerciales, publicidad, ni se ceden a terceros salvo por obligación legal.`
  },
  {
    id: 'conservacion',
    titulo: 'Plazo de conservación',
    lista: [
      'Datos laborales y de nómina: durante la relación laboral + 4 años (prescripción laboral) + 5 años datos fiscales',
      'Registros de jornada (fichajes): mínimo 4 años según RD-ley 8/2019',
      'Documentos médicos (bajas): el tiempo necesario para la gestión + prescripción',
      'Mensajes internos: 1 año desde el envío',
      'Datos bancarios (IBAN): durante la vigencia del contrato',
    ]
  },
  {
    id: 'encargados',
    titulo: 'Encargados del tratamiento',
    contenido: `Los siguientes proveedores actúan como encargados del tratamiento y disponen de acuerdo DPA firmado conforme al Art. 28 RGPD:

• Supabase Inc. — Base de datos PostgreSQL, almacenamiento de archivos y autenticación. Servidores en UE (Irlanda). DPA: supabase.com/legal/dpa
• Vercel Inc. — Hosting y entrega de la aplicación web. DPA: vercel.com/legal/dpa
• Resend Inc. — Envío de emails transaccionales (reset de contraseña, confirmación de cuenta). DPA: resend.com/legal/dpa`
  },
  {
    id: 'derechos',
    titulo: 'Tus derechos',
    contenido: `Como empleado registrado en Nexo HR tienes los siguientes derechos conforme a los artículos 15–22 del RGPD:

• Acceso: conocer qué datos se tratan y obtener una copia
• Rectificación: corregir datos inexactos (disponible desde Mi Perfil en la aplicación)
• Supresión: solicitar la eliminación cuando los datos ya no sean necesarios
• Portabilidad: recibir tus datos en formato estructurado y legible
• Limitación: solicitar la restricción temporal del tratamiento
• Oposición: oponerte al tratamiento basado en interés legítimo

Para ejercer estos derechos contacta con el departamento de RRHH de tu empresa. Plazo de respuesta: máximo 1 mes. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).`
  },
  {
    id: 'seguridad',
    titulo: 'Medidas de seguridad',
    lista: [
      'Cifrado en tránsito mediante HTTPS/TLS 1.3 en todas las comunicaciones',
      'Cifrado en reposo: todos los datos almacenados en Supabase están cifrados con AES-256',
      'Control de acceso por roles (Row Level Security): cada empleado solo puede acceder a sus propios datos',
      'Autenticación segura con tokens JWT de expiración limitada',
      'Contraseñas con longitud mínima de 8 caracteres',
      'Nóminas PDF accesibles únicamente mediante enlaces firmados con caducidad de 60 segundos',
      'Backups automáticos diarios de la base de datos',
      'Registros de auditoría de accesos en Supabase y Vercel',
    ]
  },
  {
    id: 'cookies',
    titulo: 'Cookies y datos de sesión',
    contenido: `Nexo HR utiliza únicamente cookies técnicas estrictamente necesarias para el funcionamiento de la autenticación (token de sesión JWT). No se utilizan cookies de seguimiento, publicidad o análisis de terceros.

La sesión expira automáticamente tras 1 hora de inactividad. El token se almacena en el almacenamiento local del navegador (localStorage) y se elimina al cerrar sesión.`
  },
]

function parseParagraphs(text: string) {
  return text.split('\n\n').filter(Boolean).map((line, i) => (
    <p key={i} style={{whiteSpace: 'pre-line'}} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 last:mb-0">{line}</p>
  ))
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-6 block">
            ← Volver al inicio
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-base">N</span>
            </div>
            <h1 className="page-title">Aviso Legal y Política de Privacidad</h1>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD) · Última actualización: Abril 2026
          </p>
        </div>

        {/* Índice */}
        <nav className="card p-5 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide mb-3">Contenido</p>
          <ol className="space-y-1">
            {SECCIONES.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  {i + 1}. {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Secciones */}
        {SECCIONES.map((s, i) => (
          <section key={s.id} id={s.id} className="card p-6 scroll-mt-8">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              {s.titulo}
            </h2>
            {s.contenido && parseParagraphs(s.contenido)}
            {s.lista && (
              <ul className="space-y-2">
                {s.lista.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 flex-shrink-0 mt-1.5"/>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Footer */}
        <div className="card p-5 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <strong>Aviso importante:</strong> Esta política es un documento informativo para los empleados. 
            La empresa dispone de documentación RGPD completa incluyendo el Registro de Actividades de 
            Tratamiento, los acuerdos con encargados del tratamiento (DPA) y la cláusula informativa 
            entregada a cada empleado. Para cualquier consulta sobre el tratamiento de sus datos, 
            contacte con el departamento de RRHH.
          </p>
        </div>

      </div>
    </div>
  )
}
