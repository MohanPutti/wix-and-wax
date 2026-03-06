export default function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-warm-200 animate-pulse rounded ${className ?? ''}`} />
}
