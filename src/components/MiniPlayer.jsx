import { Play, Pause, SkipBack, SkipForward, Music as MusicIcon } from 'lucide-react'

function MiniPlayer({ currentTrack, isPlaying, onTogglePlay, onNext, onPrev }) {
  if (!currentTrack) return null

  return (
    <div className="cyber-panel p-3 fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyber-magenta to-cyber-yellow flex items-center justify-center flex-shrink-0 corner-cut">
          <MusicIcon size={20} className="text-black" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate">{currentTrack.name}</div>
          <div className="text-cyber-magenta text-xs truncate">{currentTrack.album}</div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onPrev}
            className="p-1 hover:bg-cyber-magenta/20 transition-colors rounded"
          >
            <SkipBack size={16} className="text-white" />
          </button>
          <button
            onClick={onTogglePlay}
            className="p-2 bg-cyber-magenta/20 hover:bg-cyber-magenta/30 transition-colors rounded"
          >
            {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
          </button>
          <button
            onClick={onNext}
            className="p-1 hover:bg-cyber-magenta/20 transition-colors rounded"
          >
            <SkipForward size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MiniPlayer
