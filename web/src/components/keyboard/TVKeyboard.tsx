import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ['SPACE', 'BACKSPACE', 'SEARCH'],
]

interface Props {
  onKeyPress: (key: string) => void
  focusKey?: string
}

function KeyButton({
  label,
  keyboardFocusKey,
  onSelect,
}: {
  label: string
  keyboardFocusKey: string
  onSelect: () => void
}) {
  const { ref, focused } = useFocusable({
    focusKey: keyboardFocusKey,
    onEnterPress: onSelect,
  })

  return (
    <button
      ref={ref}
      className={`key-btn ${focused ? 'focused' : ''} key-btn--${label.toLowerCase()}`}
      onClick={onSelect}
    >
      {label === 'BACKSPACE' ? '⌫' : label === 'SPACE' ? '␣' : label}
    </button>
  )
}

export default function TVKeyboard({ onKeyPress, focusKey: propFocusKey }: Props) {
  const { ref, focusKey } = useFocusable({ focusKey: propFocusKey ?? 'TV_KEYBOARD' })

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="tv-keyboard">
        {ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="keyboard-row">
            {row.map((key) => (
              <KeyButton
                key={key}
                label={key}
                keyboardFocusKey={`KEY_${key}`}
                onSelect={() => onKeyPress(key)}
              />
            ))}
          </div>
        ))}
      </div>
    </FocusContext.Provider>
  )
}
