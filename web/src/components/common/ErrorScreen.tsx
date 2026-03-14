interface Props {
  message: string
}

export default function ErrorScreen({ message }: Props) {
  return (
    <div className="error-screen">
      <div className="error-icon">⚠</div>
      <div className="error-message">{message}</div>
    </div>
  )
}
