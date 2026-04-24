import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Music, Calendar, Download, ExternalLink, Hexagon, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import AudioPlayer from './components/AudioPlayer'
import MiniPlayer from './components/MiniPlayer'
import ImageModal from './components/ImageModal'

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [data, setData] = useState({ albums: [], concerts: [], merch: [], media: [] })
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [allTracks, setAllTracks] = useState([])
  const [fileSizes, setFileSizes] = useState({})
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [merchSearch, setMerchSearch] = useState('')
  const [merchSort, setMerchSort] = useState('az')
  const [selectedTags, setSelectedTags] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('none')
  const [showW2GModal, setShowW2GModal] = useState(false)
  const audioRef = useRef(null)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    Promise.all([
      fetch('albums.json').then(res => res.json()),
      fetch('concerts.json').then(res => res.json()),
      fetch('merch.json').then(res => res.json()),
      fetch('media.json').then(res => res.json())
    ])
      .then(([albums, concerts, merch, media]) => {
        setData({ albums, concerts, merch, media })
        const tracks = albums.flatMap(album => 
          album.tracks.map(track => ({ ...track, album: album.title }))
        )
        setAllTracks(tracks)
      })
      .catch(err => console.error('Erreur chargement JSON:', err))
  }, [])

  useEffect(() => {
    data.merch.forEach(item => {
      fetch(item.file, { method: 'HEAD' })
        .then(response => {
          const size = response.headers.get('content-length')
          if (size) {
            setFileSizes(prev => ({
              ...prev,
              [item.file]: (parseInt(size) / (1024 * 1024)).toFixed(2)
            }))
          }
        })
        .catch(() => {})
    })
  }, [data.merch])

  const albums = data.albums
  const merch = data.merch
  const media = data.media

  const isPastConcert = (dateStr) => {
    return new Date(dateStr) < new Date()
  }

  const sortedConcerts = useMemo(() => {
    const now = new Date()
    return [...data.concerts].sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      const isPastA = dateA < now
      const isPastB = dateB < now

      if (isPastA && !isPastB) return 1
      if (!isPastA && isPastB) return -1
      
      if (!isPastA && !isPastB) {
        return dateA - dateB
      }
      
      return dateB - dateA
    })
  }, [data.concerts])

  const concerts = sortedConcerts

  const allTags = useMemo(() => {
    const tags = new Set()
    merch.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }, [merch])

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const filteredAndSortedMerch = useMemo(() => {
    let filtered = [...merch]

    if (merchSearch) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(merchSearch.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(merchSearch.toLowerCase())))
      )
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags && item.tags.some(tag => selectedTags.includes(tag))
      )
    }

    if (merchSort === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (merchSort === 'za') {
      filtered.sort((a, b) => b.name.localeCompare(a.name))
    }

    return filtered
  }, [merch, merchSearch, merchSort, selectedTags])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const now = Date.now()
      if (now - lastUpdateRef.current >= 500) {
        setCurrentTime(audioRef.current.currentTime)
        lastUpdateRef.current = now
      }
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      audioRef.current.volume = 0.5
    }
  }, [])

  const handleSeek = useCallback((newTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [])

  const nextTrack = useCallback(() => {
    if (shuffle) {
      let randomIndex = Math.floor(Math.random() * allTracks.length)
      while (randomIndex === currentTrackIndex && allTracks.length > 1) {
        randomIndex = Math.floor(Math.random() * allTracks.length)
      }
      setCurrentTrackIndex(randomIndex)
    } else {
      setCurrentTrackIndex(prev => (prev + 1) % allTracks.length)
    }
  }, [allTracks.length, shuffle, currentTrackIndex])

  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else if (repeat === 'all') {
      nextTrack()
    } else {
      setIsPlaying(false)
    }
  }, [repeat, nextTrack])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const prevTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
    } else {
      setCurrentTrackIndex(prev => prev === 0 ? allTracks.length - 1 : prev - 1)
    }
  }, [allTracks.length])

  useEffect(() => {
    if (audioRef.current && allTracks[currentTrackIndex]) {
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play().catch(() => {})
      }
    }
  }, [currentTrackIndex])

  const NavButton = React.memo(({ children, onClick, active }) => (
    <button
      onClick={onClick}
      className={`cyber-button p-4 w-full text-left transition-all duration-300 ${active ? 'animate-glow' : ''}`}
    >
      <span className="relative z-10 flex items-center gap-3 text-white font-bold uppercase tracking-wider">
        <ChevronRight className={`${active ? 'text-cyber-yellow' : 'text-cyber-magenta'} transition-colors`} size={20} />
        {children}
      </span>
    </button>
  ))

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-magenta to-transparent animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-yellow to-transparent animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <header className="cyber-panel p-4 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-magenta opacity-10 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
              <video 
                src="media/smiley_magenta.webm" 
                className="w-20 h-20 md:w-32 md:h-32 flex-shrink-0"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="text-center md:text-left w-full md:w-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black text-cyber-magenta break-words" 
                    data-text="MAGENTA">
                  MAGENTA
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mt-2">
                  <div className="h-px w-4 md:w-8 bg-gradient-to-r from-cyber-magenta to-cyber-yellow"></div>
                  <p className="text-cyber-yellow text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide md:tracking-widest whitespace-nowrap">
                    Burn • Corpo • Shit
                  </p>
                  <div className="h-px w-4 md:w-8 bg-gradient-to-r from-cyber-yellow to-cyber-magenta"></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <nav className="lg:col-span-1 space-y-4">
            <div className="cyber-panel p-4">
              <h3 className="text-cyber-yellow font-bold uppercase tracking-wider mb-4 text-sm">
                // NAVIGATION
              </h3>
              <div className="space-y-3">
                <NavButton onClick={() => setActiveSection('home')} active={activeSection === 'home'}>
                  Accueil
                </NavButton>
                <NavButton onClick={() => setActiveSection('music')} active={activeSection === 'music'}>
                  Musique
                </NavButton>
                <NavButton onClick={() => setShowW2GModal(true)} active={false}>
                  W2G
                </NavButton>
                <NavButton onClick={() => setActiveSection('concerts')} active={activeSection === 'concerts'}>
                  Concerts
                </NavButton>
                <NavButton onClick={() => setActiveSection('merch')} active={activeSection === 'merch'}>
                  Merch
                </NavButton>
                <NavButton onClick={() => setActiveSection('media')} active={activeSection === 'media'}>
                  Media
                </NavButton>
                <NavButton onClick={() => setActiveSection('about')} active={activeSection === 'about'}>
                  À Propos
                </NavButton>
              </div>
            </div>

          </nav>

          <main className="lg:col-span-3">
            {activeSection === 'home' && (
              <div className="space-y-6">
                <div className="cyber-panel p-6">
                  <h3 className="text-2xl font-bold text-cyber-yellow mb-4 flex items-center gap-3">
                    <Music size={24} />
                    DERNIERS SONS
                  </h3>
                  <div className="space-y-2">
                    {albums.flatMap(album => 
                      album.tracks.map(track => ({ ...track, album: album.title }))
                    ).slice(0, 3).map((track, idx) => {
                      const globalTrackIndex = allTracks.findIndex(
                        t => t.name === track.name && t.album === track.album
                      )
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentTrackIndex(globalTrackIndex)
                            if (!isPlaying) {
                              setTimeout(() => togglePlay(), 100)
                            }
                          }}
                          className="w-full flex items-center justify-between p-3 bg-black/50 border border-cyber-magenta/30 hover:border-cyber-magenta hover:bg-black/70 transition-all duration-200 corner-cut cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Music size={18} className="text-cyber-yellow" />
                            <div>
                              <span className="text-white font-medium">{track.name}</span>
                              <span className="text-cyber-magenta/60 text-sm ml-2">• {track.album}</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <a 
                              href={track.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-cyber-magenta/20 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={18} className="text-cyber-magenta" />
                            </a>
                            <a 
                              href={track.mp3}
                              download
                              className="p-2 hover:bg-cyber-yellow/20 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download size={18} className="text-cyber-yellow" />
                            </a>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="cyber-panel p-6">
                  <h3 className="text-2xl font-bold text-cyber-yellow mb-4 flex items-center gap-3">
                    <Calendar size={24} />
                    PROCHAINS CONCERTS
                  </h3>
                  <div className="space-y-3">
                    {sortedConcerts.filter(c => !isPastConcert(c.date)).slice(0, 3).map((concert, idx) => {
                      const isPast = isPastConcert(concert.date)
                      const concertDate = new Date(concert.date)
                      return (
                        <button 
                          key={idx}
                          onClick={() => setActiveSection('concerts')}
                          className="w-full flex items-start gap-4 p-4 bg-black/50 border border-cyber-yellow/30 hover:border-cyber-yellow hover:bg-black/70 transition-all duration-200 corner-cut cursor-pointer"
                        >
                          <div className="flex-shrink-0">
                            <div className={`w-16 h-16 flex flex-col items-center justify-center text-center border-2 ${
                              isPast 
                                ? 'border-gray-500 bg-gray-900' 
                                : 'border-cyber-magenta bg-black'
                            } corner-cut`}>
                              <div className={`text-xl font-black ${isPast ? 'text-gray-500' : 'text-cyber-yellow'}`}>
                                {concertDate.toLocaleDateString('fr-FR', { day: '2-digit' })}
                              </div>
                              <div className={`text-xs font-bold uppercase ${isPast ? 'text-gray-600' : 'text-cyber-magenta'}`}>
                                {concertDate.toLocaleDateString('fr-FR', { month: 'short' })}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-white font-bold text-lg mb-1">{concert.venue}</div>
                            <div className="text-cyber-magenta text-sm">
                              {concert.city} • {concert.time}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'music' && (
              <div className="space-y-6">
                <div className="cyber-panel p-6">
                  <h2 className="text-3xl font-display font-black text-cyber-magenta mb-2">
                    // MUSIQUE
                  </h2>
                  <div className="cyber-divider my-4"></div>
                </div>

                {allTracks.length > 0 && (
                  <AudioPlayer 
                    tracks={allTracks}
                    currentTrackIndex={currentTrackIndex}
                    onTrackChange={setCurrentTrackIndex}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    audioRef={audioRef}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                    shuffle={shuffle}
                    setShuffle={setShuffle}
                    repeat={repeat}
                    setRepeat={setRepeat}
                    onNext={nextTrack}
                    onPrev={prevTrack}
                  />
                )}

                {albums.map((album, idx) => (
                  <div key={idx} className="cyber-panel p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="vinyl-record w-48 h-48 mx-auto md:mx-0 flex-shrink-0">
                        <div className="vinyl-label">
                          <img 
                            src={album.cover} 
                            alt={album.title}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-cyber-yellow">{album.title}</h3>
                            {album.youtube && (
                            <a 
                              href={album.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-cyber-yellow hover:text-white transition-colors text-sm font-bold"
                              title="Voir l'album sur YouTube"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                              <span>ALBUM</span>
                            </a>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {album.tracks.map((track, trackIdx) => {
                            const globalTrackIndex = allTracks.findIndex(
                              t => t.name === track.name && t.album === album.title
                            )
                            return (
                              <button 
                              key={trackIdx}
                              onClick={() => {
                                setCurrentTrackIndex(globalTrackIndex)
                                if (!isPlaying) {
                                  setTimeout(() => togglePlay(), 100)
                                }
                              }}
                              className="w-full flex items-center justify-between p-3 bg-black/50 border border-cyber-magenta/30 hover:border-cyber-magenta/50 hover:bg-black/70 transition-all duration-200 corner-cut cursor-pointer"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Music size={18} className="text-cyber-yellow" />
                                  <span className="text-white font-medium hover:text-cyber-yellow transition-colors text-left">
                                    {track.name}
                                  </span>
                                </div>
                                <div className="flex gap-3">
                                  <a 
                                    href={track.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-cyber-magenta/20 transition-colors rounded relative z-10"
                                    title="Voir sur YouTube"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFF00">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                  </a>
                                  <a 
                                    href={track.mp3}
                                    download
                                    className="p-2 hover:bg-cyber-yellow/20 transition-colors relative z-10"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Download size={18} className="text-cyber-yellow" />
                                  </a>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'concerts' && (
              <div className="space-y-6">
                <div className="cyber-panel p-6">
                  <h2 className="text-3xl font-display font-black text-cyber-magenta mb-2">
                    // CONCERTS
                  </h2>
                  <div className="cyber-divider my-4"></div>
                </div>

                <div className="space-y-4">
                  {concerts.map((concert, idx) => {
                    const isPast = isPastConcert(concert.date)
                    const concertDate = new Date(concert.date)
                    return (
                      <div 
                        key={idx}
                        className={`cyber-panel p-6 ${isPast ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-6">
                          <div className="flex-shrink-0">
                            <div className={`w-20 h-20 flex flex-col items-center justify-center text-center border-2 ${
                              isPast 
                                ? 'border-gray-500 bg-gray-900' 
                                : 'border-cyber-magenta bg-black'
                            } corner-cut`}>
                              <div className={`text-2xl font-black ${isPast ? 'text-gray-500' : 'text-cyber-yellow'}`}>
                                {concertDate.toLocaleDateString('fr-FR', { day: '2-digit' })}
                              </div>
                              <div className={`text-xs font-bold uppercase ${isPast ? 'text-gray-600' : 'text-cyber-magenta'}`}>
                                {concertDate.toLocaleDateString('fr-FR', { month: 'short' })}
                              </div>
                              <div className={`text-xs font-bold ${isPast ? 'text-gray-600' : 'text-white'}`}>
                                {concertDate.getFullYear()}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            {isPast && (
                              <div className="inline-block px-3 py-1 bg-gray-700 text-white text-xs font-bold uppercase mb-2 corner-cut">
                                TERMINÉ
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="text-2xl font-bold text-cyber-yellow mb-1">{concert.venue}</div>
                                <div className="text-sm text-cyber-magenta">{concert.time}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-white">{concert.city}</div>
                              </div>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center">
                            {concert.discord && (
                              <a 
                                href={concert.discord}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-cyber-yellow/10 transition-colors rounded-full border border-cyber-yellow/30 hover:border-cyber-yellow"
                                title="Rejoindre sur Discord"
                              >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFF00">
                                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeSection === 'merch' && (
              <div className="space-y-6">
                <div className="cyber-panel p-6">
                  <h2 className="text-3xl font-display font-black text-cyber-magenta mb-2">
                    // MERCH
                  </h2>
                  <div className="cyber-divider my-4"></div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-magenta" size={20} />
                      <input
                        type="text"
                        placeholder="Rechercher un merch..."
                        value={merchSearch}
                        onChange={(e) => setMerchSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-black/50 border border-cyber-magenta/30 text-white placeholder-cyber-magenta/50 focus:border-cyber-magenta focus:outline-none transition-colors corner-cut"
                      />
                    </div>
                    
                    <div className="relative">
                      <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-yellow" size={20} />
                      <select
                        value={merchSort}
                        onChange={(e) => setMerchSort(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-black/50 border border-cyber-yellow/30 text-white focus:border-cyber-yellow focus:outline-none transition-colors corner-cut appearance-none cursor-pointer"
                      >
                        <option value="az">Tri A → Z</option>
                        <option value="za">Tri Z → A</option>
                      </select>
                    </div>
                  </div>

                  {allTags.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-cyber-yellow font-bold text-sm mb-3 uppercase">Filtrer par tags:</h3>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-2 text-xs font-bold uppercase border transition-all duration-200 ${
                              selectedTags.includes(tag)
                                ? 'bg-cyber-magenta text-black border-cyber-magenta'
                                : 'bg-cyber-magenta/10 text-cyber-yellow border-cyber-magenta/40 hover:border-cyber-magenta'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      {selectedTags.length > 0 && (
                        <button
                          onClick={() => setSelectedTags([])}
                          className="mt-3 text-cyber-yellow hover:text-white text-xs underline transition-colors"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAndSortedMerch.map((item, idx) => (
                    <div 
                      key={idx}
                      className="cyber-panel p-6 group"
                    >
                      {item.image && (
                        <img 
                          src={item.image}
                          alt={item.name}
                          onClick={() => {
                            setSelectedImage(item.image)
                            setSelectedImageName(item.name)
                          }}
                          className="w-full h-48 object-cover corner-cut mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg mb-2">{item.name}</h3>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {item.tags.map((tag, tagIdx) => (
                                <span 
                                  key={tagIdx}
                                  className={`px-2 py-1 text-xs font-bold uppercase border transition-colors ${
                                    selectedTags.includes(tag)
                                      ? 'bg-cyber-magenta text-black border-cyber-magenta'
                                      : 'bg-cyber-magenta/20 text-cyber-yellow border-cyber-magenta/40'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {fileSizes[item.file] && (
                            <div className="text-cyber-magenta text-sm">
                              Taille: {fileSizes[item.file]} MO
                            </div>
                          )}
                        </div>
                        <a 
                          href={item.file}
                          download
                          className="p-3 hover:bg-cyber-yellow/20 transition-colors rounded flex-shrink-0"
                        >
                          <Download size={24} className="text-cyber-yellow group-hover:animate-pulse" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredAndSortedMerch.length === 0 && (
                  <div className="cyber-panel p-8 text-center">
                    <p className="text-cyber-magenta text-lg">Aucun merch trouvé avec ces critères.</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'media' && (
              <div className="space-y-6">
                <div className="cyber-panel p-6">
                  <h2 className="text-3xl font-display font-black text-cyber-magenta mb-2">
                    // MEDIA
                  </h2>
                  <div className="cyber-divider my-4"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {media.map((item, idx) => {
                    const pattern = idx % 3
                    const isRectangle = pattern === 0
                    const gridClass = isRectangle ? 'md:col-span-2 md:row-span-1' : 'md:col-span-1 md:row-span-1'
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedImage(item.url)
                          setSelectedImageName(item.title)
                        }}
                        style={{
                          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
                          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,0,20,0.95) 100%)',
                        }}
                        className={`p-0 transition-all duration-200 cursor-pointer group relative border-2 border-cyber-magenta/80 hover:border-cyber-magenta ${gridClass}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyber-magenta/20 to-cyber-yellow/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
                        
                        <div className={`relative overflow-hidden w-full h-full ${isRectangle ? 'aspect-[2/1]' : 'aspect-square'}`}>
                          <img 
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <div className="border-l-2 border-cyber-magenta pl-3">
                                <h3 className="text-white font-bold text-lg">{item.title}</h3>
                              </div>
                            </div>
                          </div>
                          
                          <div className="absolute top-2 right-2 w-2 h-2 bg-cyber-yellow opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {media.length === 0 && (
                  <div className="cyber-panel p-8 text-center">
                    <p className="text-cyber-magenta text-lg">Aucune photo disponible pour le moment.</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-6">
                <div className="cyber-panel p-6">
                  <h2 className="text-3xl font-display font-black text-cyber-magenta mb-2">
                    // À PROPOS
                  </h2>
                  <div className="cyber-divider my-4"></div>
                </div>

                <div className="cyber-panel p-8">
                  <div className="space-y-4 text-white/90 text-lg">
                    <p>
                      <span className="text-cyber-magenta font-bold">Magenta</span> est plus qu'un groupe de{' '}
                      <span className="text-cyber-yellow">rock</span>, c'est un appel à la résistance.
                    </p>
                    <p>
                      Dans un monde où les corpos contrôlent chaque aspect de nos vies, 
                      Magenta refuse de se soumettre. Chaque accord, chaque parole est une arme contre 
                      l'asservissement corporatif.
                    </p>
                  </div>
                </div>

                <div className="cyber-panel p-8">
                  <h3 className="text-2xl font-bold text-cyber-yellow mb-6">LES MEMBRES</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <img 
                        src="media/img_about/straya.png" 
                        alt="Straya"
                        className="w-full aspect-square object-cover mb-3 corner-cut"
                      />
                      <h4 className="text-lg font-bold text-cyber-yellow">STRAYA</h4>
                      <p className="text-cyber-magenta text-sm">Violoniste</p>
                    </div>

                    <div className="text-center">
                      <img 
                        src="media/img_about/jett.png" 
                        alt="Jett"
                        className="w-full aspect-square object-cover mb-3 corner-cut"
                      />
                      <h4 className="text-lg font-bold text-cyber-yellow">JETT</h4>
                      <p className="text-cyber-magenta text-sm">Chanteur • Guitariste</p>
                    </div>

                    <div className="text-center">
                      <img 
                        src="media/img_about/xayden.png" 
                        alt="Xayden"
                        className="w-full aspect-square object-cover mb-3 corner-cut"
                      />
                      <h4 className="text-lg font-bold text-cyber-yellow">XAYDEN</h4>
                      <p className="text-cyber-magenta text-sm">Bassiste</p>
                    </div>

                    <div className="text-center">
                      <img 
                        src="media/img_about/sanakh.png" 
                        alt="Sanakh"
                        className="w-full aspect-square object-cover mb-3 corner-cut"
                      />
                      <h4 className="text-lg font-bold text-cyber-yellow">SANAKH</h4>
                      <p className="text-cyber-magenta text-sm">Batteuse • Chanteuse</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <footer className="cyber-panel p-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm uppercase tracking-wider">
              © {new Date().getFullYear()} MAGENTA - TOUS DROITS RÉSERVÉS
            </p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyber-magenta rounded-full animate-pulse"></div>
              <span className="text-cyber-magenta font-bold uppercase text-sm">SYSTEM ONLINE</span>
            </div>
          </div>
        </footer>
      </div>

      {allTracks.length > 0 && allTracks[currentTrackIndex] && (
        <audio
          ref={audioRef}
          src={allTracks[currentTrackIndex].mp3}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage}
          imageName={selectedImageName}
          onClose={() => {
            setSelectedImage(null)
            setSelectedImageName('')
          }}
        />
      )}

      {showW2GModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowW2GModal(false)}>
          <div className="cyber-panel p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-yellow opacity-10 blur-3xl rounded-full"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-cyber-magenta mb-4">OUVRIR W2G ?</h3>
              <p className="text-white mb-6">Vous allez ouvrir <span className="text-cyber-yellow font-bold">Watch2Gether</span> dans un nouvel onglet pour écouter la musique ensemble.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    window.open('https://w2g.tv/?r=dmd75y71w47v69e0wh', '_blank', 'noopener,noreferrer')
                    setShowW2GModal(false)
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyber-magenta to-cyber-yellow text-black font-bold uppercase tracking-wider hover:opacity-80 transition-opacity corner-cut"
                >
                  Ouvrir
                </button>
                <button
                  onClick={() => setShowW2GModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-cyber-magenta text-cyber-magenta font-bold uppercase tracking-wider hover:bg-cyber-magenta/20 transition-colors corner-cut"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection !== 'music' && allTracks.length > 0 && (
        <MiniPlayer 
          currentTrack={allTracks[currentTrackIndex]}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onNext={nextTrack}
          onPrev={prevTrack}
        />
      )}
    </div>
  )
}

export default App
