import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1 } from 'lucide-react'

function AudioPlayer({ tracks, currentTrackIndex, onTrackChange, isPlaying, setIsPlaying, audioRef, currentTime, duration, onSeek, shuffle, setShuffle, repeat, setRepeat, onNext, onPrev }) {
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('magenta-volume')
    return savedVolume ? parseFloat(savedVolume) : 0.5
  })
  const [isMuted, setIsMuted] = useState(false)

  const currentTrack = tracks[currentTrackIndex]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    localStorage.setItem('magenta-volume', volume.toString())
  }, [volume])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const newTime = (e.target.value / 100) * duration
    onSeek(newTime)
  }

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(1)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one']
    const currentIndex = modes.indexOf(repeat)
    setRepeat(modes[(currentIndex + 1) % modes.length])
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className="cyber-panel p-4 sticky bottom-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex-1">
            <div className="text-white font-bold truncate">{currentTrack.name}</div>
            <div className="text-cyber-magenta text-xs">{currentTrack.album}</div>
          </div>
          <div className="text-cyber-yellow text-xs">
            {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-cyber-yellow text-xs w-12">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={(currentTime / duration) * 100 || 0}
            onChange={handleSeek}
            className="flex-1 h-1 bg-cyber-magenta/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-magenta"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 hover:bg-cyber-magenta/20 transition-colors rounded ${shuffle ? 'text-cyber-yellow' : 'text-white/60'}`}
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-2 hover:bg-cyber-magenta/20 transition-colors rounded ${repeat !== 'none' ? 'text-cyber-yellow' : 'text-white/60'}`}
            >
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onPrev}
              className="p-2 hover:bg-cyber-magenta/20 transition-colors rounded text-white"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              className="cyber-button p-3"
            >
              <span className="relative z-10">
                {isPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
              </span>
            </button>
            <button
              onClick={onNext}
              className="p-2 hover:bg-cyber-magenta/20 transition-colors rounded text-white"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-cyber-magenta/20 transition-colors rounded text-white"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-cyber-magenta/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-magenta"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
