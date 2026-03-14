import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

interface Props {
  focusKey?: string
  onSelect: () => void
  children: React.ReactNode
  className?: string
}

export default function FocusableButton({ focusKey, onSelect, children, className = '' }: Props) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  })

  return (
    <button
      ref={ref}
      className={`focusable-btn ${focused ? 'focused' : ''} ${className}`}
      onClick={onSelect}
    >
      {children}
    </button>
  )
}
