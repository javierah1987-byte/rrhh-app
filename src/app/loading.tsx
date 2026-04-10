export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-900" role="status" aria-label="Cargando página">
      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 animate-pulse">
        <span className="text-white font-black text-lg">N</span>
      </div>
      <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 rounded-full animate-[loading_1.2s_ease-in-out_infinite]"/>
      </div>
      <span className="sr-only">Cargando...</span>
    </div>
  )
}
