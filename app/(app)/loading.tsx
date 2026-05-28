export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )
}
