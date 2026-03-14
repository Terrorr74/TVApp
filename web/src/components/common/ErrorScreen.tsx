import FocusableButton from './FocusableButton'

interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorScreen({ message, onRetry }: Props) {
  return (
    <div className="error-screen">
      <div className="error-icon">⚠</div>
      <div className="error-message">{message}</div>
      {onRetry && (
        <FocusableButton focusKey="ERROR_RETRY" onSelect={onRetry} className="error-retry-btn">
          Retry
        </FocusableButton>
      )}
    </div>
  )
}
