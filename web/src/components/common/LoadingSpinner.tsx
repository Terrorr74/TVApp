export default function LoadingSpinner({ label }: { label?: string } = {}) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      {label && <div className="loading-label">{label}</div>}
    </div>
  )
}
