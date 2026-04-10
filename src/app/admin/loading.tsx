import { SkeletonStats, SkeletonCard } from '@/components/shared'

export default function AdminLoading() {
  return (
    <div className="space-y-5 animate-pulse" role="status" aria-label="Cargando panel de administración">
      <div className="h-8 w-40 skeleton rounded-xl"/>
      <SkeletonStats cols={4}/>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SkeletonCard/><SkeletonCard/>
      </div>
      <span className="sr-only">Cargando...</span>
    </div>
  )
}
