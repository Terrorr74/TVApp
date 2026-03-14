import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { formatDuration } from '../../api/piped'

interface Props {
  playing: boolean
  currentTime: number
  duration: number
  onPlayPause: () => void
  onSeek: (delta: number) => void
  onBack: () => void
  title: string
}

function ControlButton({
  label,
  focusKey,
  onSelect,
}: {
  label: string
  focusKey: string
  onSelect: () => void
}) {
  const { ref, focused } = useFocusable({ focusKey, onEnterPress: onSelect })
  return (
    <button ref={ref} className={`ctrl-btn ${focused ? 'focused' : ''}`} onClick={onSelect}>
      {label}
    </button>
  )
}

export default function PlayerControls({
  playing,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onBack,
  title,
}: Props) {
  const { ref, focusKey } = useFocusable({ focusKey: 'PLAYER_CONTROLS' })
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="player-controls">
        <div className="player-title">{title}</div>
        <div className="player-progress-bar">
          <div className="player-progress-fill" style={{ width: `${progress}%` }} />
          <div className="player-progress-thumb" style={{ left: `${progress}%` }} />
        </div>
        <div className="player-time">
          {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
        </div>
        <div className="player-buttons">
          <ControlButton label="← Back" focusKey="CTRL_BACK" onSelect={onBack} />
          <ControlButton label="⏮ -10s" focusKey="CTRL_REWIND" onSelect={() => onSeek(-10)} />
          <ControlButton
            label={playing ? '⏸ Pause' : '▶ Play'}
            focusKey="CTRL_PLAYPAUSE"
            onSelect={onPlayPause}
          />
          <ControlButton label="+10s ⏭" focusKey="CTRL_FORWARD" onSelect={() => onSeek(10)} />
        </div>
      </div>
    </FocusContext.Provider>
  )
}
