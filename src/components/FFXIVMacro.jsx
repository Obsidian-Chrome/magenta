import React, { useState, useMemo, useRef } from 'react'
import { Clock, Copy, AlertCircle, RefreshCw } from 'lucide-react'

function FFXIVMacro() {
  const [macroText, setMacroText] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [sndMode, setSndMode] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const textareaRef = useRef(null)
  const highlightRef = useRef(null)
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  
  const parseWaitTime = (line) => {
    const waitMatches = line.matchAll(/<wait\.(\d+)>/gi)
    let totalTime = 0
    for (const match of waitMatches) {
      const seconds = parseInt(match[1])
      totalTime += sndMode ? seconds : Math.min(seconds, 60)
    }
    return totalTime
  }
  
  const macroStats = useMemo(() => {
    const lines = macroText.split('\n')
    const totalLines = lines.length
    
    // Trouver la ligne actuelle basée sur la position du curseur
    // Compter les \n avant la position du curseur
    const textBeforeCursor = macroText.substring(0, cursorPosition)
    const currentLineIndex = (textBeforeCursor.match(/\n/g) || []).length
    
    const currentLine = lines[currentLineIndex] || ''
    const currentLineCharCount = currentLine.length
    
    // Calculer le temps cumulé jusqu'à la ligne actuelle
    let cumulativeTime = 0
    for (let i = 0; i <= currentLineIndex; i++) {
      cumulativeTime += parseWaitTime(lines[i] || '')
    }
    
    // Calculer le temps total
    let totalTime = 0
    lines.forEach(line => {
      totalTime += parseWaitTime(line)
    })
    
    const charLimit = sndMode ? 512 : 180
    const lineLimit = sndMode ? Infinity : 15
    
    const hasOverLimitLines = lines.some(line => line.length > charLimit)
    const hasTooManyLines = !sndMode && totalLines > lineLimit
    
    const hasInvalidWait = !sndMode && lines.some(line => {
      const waitMatch = line.match(/<wait\.(\d+)>/i)
      if (waitMatch) {
        const seconds = parseInt(waitMatch[1])
        return seconds > 60
      }
      return false
    })
    
    return {
      totalLines,
      currentLineIndex: currentLineIndex + 1, // 1-indexed pour l'affichage
      currentLineCharCount,
      cumulativeTime,
      totalTime,
      hasOverLimitLines,
      hasTooManyLines,
      hasInvalidWait,
      hasErrors: hasOverLimitLines || hasTooManyLines || hasInvalidWait
    }
  }, [macroText, cursorPosition, sndMode])
  
  const handleTextChange = (e) => {
    setMacroText(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }
  
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }
  
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart)
    }
  }
  
  const copyMacro = () => {
    navigator.clipboard.writeText(macroText)
    setShowCopySuccess(true)
    setTimeout(() => setShowCopySuccess(false), 2000)
  }
  
  const clearMacro = () => {
    setShowClearModal(true)
  }
  
  const confirmClear = () => {
    setMacroText('')
    setCursorPosition(0)
    setShowClearModal(false)
  }
  
  const convertLyrics = () => {
    const text = macroText.trim()
    if (!text) return
    
    const lines = text.split('\n')
    const macroLines = ['/echo NOM DE LA MUSIQUE <wait.XX>']
    let currentBlock = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Si c'est une ligne entre crochets, la convertir en /echo
      if (trimmed.match(/^\[.*\]$/)) {
        // Finaliser le bloc en cours s'il existe
        if (currentBlock.length > 0) {
          processBlock(currentBlock.join(' '), macroLines)
          currentBlock = []
        }
        macroLines.push(`/echo ${trimmed}`)
      } else if (trimmed === '') {
        // Ligne vide : finaliser le bloc en cours
        if (currentBlock.length > 0) {
          processBlock(currentBlock.join(' '), macroLines)
          currentBlock = []
        }
      } else {
        // Ajouter la ligne au bloc en cours
        currentBlock.push(trimmed)
      }
    }
    
    // Finaliser le dernier bloc s'il existe
    if (currentBlock.length > 0) {
      processBlock(currentBlock.join(' '), macroLines)
    }
    
    setMacroText(macroLines.join('\n'))
    setCursorPosition(0)
  }
  
  const highlightSyntax = (text) => {
    // Remplacer les commandes (/echo, /y, etc.) en jaune
    let highlighted = text.replace(/(\/\w+)/g, '<span style="color: #ffff00;">$1</span>')
    // Remplacer les <wait.XX> en rose/magenta (dès que wait se trouve entre <>)
    highlighted = highlighted.replace(/(&lt;wait\.[^&]*&gt;)/g, '<span style="color: #ff00ff;">$1</span>')
    return highlighted
  }
  
  const processBlock = (block, macroLines) => {
    const maxLength = 512 - '/y '.length - ' ♪ <wait.XX>'.length
    
    if (block.length <= maxLength) {
      macroLines.push(`/y ${block} ♪ <wait.XX>`)
    } else {
      // Découper intelligemment le bloc en respectant les phrases
      const sentences = block.match(/[^.!?]+[.!?]+/g) || [block]
      let currentLine = ''
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim()
        const testLine = currentLine ? `${currentLine} ${trimmedSentence}` : trimmedSentence
        
        if (testLine.length <= maxLength) {
          currentLine = testLine
        } else {
          if (currentLine) {
            macroLines.push(`/y ${currentLine} ♪ <wait.XX>`)
          }
          // Si une phrase seule dépasse la limite, la couper par mots
          if (trimmedSentence.length > maxLength) {
            const words = trimmedSentence.split(' ')
            currentLine = ''
            for (const word of words) {
              const testWord = currentLine ? `${currentLine} ${word}` : word
              if (testWord.length <= maxLength) {
                currentLine = testWord
              } else {
                if (currentLine) {
                  macroLines.push(`/y ${currentLine} ♪ <wait.XX>`)
                }
                currentLine = word
              }
            }
          } else {
            currentLine = trimmedSentence
          }
        }
      }
      
      if (currentLine) {
        macroLines.push(`/y ${currentLine} ♪ <wait.XX>`)
      }
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="max-w-full">
        <div className="cyber-panel p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-display font-black text-cyber-magenta">
              ÉDITEUR DE MACROS
            </h1>
            <div className="flex gap-2 items-center">
              <div className="group relative">
                <button
                  onClick={() => setSndMode(!sndMode)}
                  className={`px-4 py-2 border transition-colors rounded flex items-center gap-2 cursor-pointer ${
                    sndMode 
                      ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/50' 
                      : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border-gray-500/50'
                  }`}
                >
                  <span className="font-semibold">SND</span>
                </button>
                <div className="absolute right-0 top-12 w-64 p-3 bg-black/95 border border-cyber-yellow/50 rounded text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <p className="font-semibold text-cyber-yellow mb-1">Mode SND (Something Need Doing)</p>
                  <p>Change le système pour s'adapter aux macros Something Need Doing avec wait illimités, lignes illimitées et 512 caractères par ligne.</p>
                </div>
              </div>
              {sndMode && (
                <div className="group relative">
                  <button
                    onClick={convertLyrics}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 transition-colors rounded flex items-center gap-2 cursor-pointer"
                    disabled={macroText.trim() === ''}
                  >
                    <RefreshCw size={18} />
                    <span className="hidden sm:inline">Convertir</span>
                  </button>
                  <div className="absolute right-0 top-12 w-64 p-3 bg-black/95 border border-purple-500/50 rounded text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <p className="font-semibold text-purple-400 mb-1">Convertir les lyrics</p>
                    <p>Transforme les lyrics en emotes.</p>
                  </div>
                </div>
              )}
              <button
                onClick={copyMacro}
                className="px-4 py-2 bg-cyber-yellow/20 hover:bg-cyber-yellow/30 text-cyber-yellow border border-cyber-yellow/50 transition-colors rounded flex items-center gap-2 cursor-pointer"
                disabled={macroText.trim() === ''}
              >
                <Copy size={18} />
                <span className="hidden sm:inline">Copier</span>
              </button>
              <button
                onClick={clearMacro}
                className="px-4 py-2 bg-cyber-magenta/20 hover:bg-cyber-magenta/30 text-cyber-magenta border border-cyber-magenta/50 transition-colors rounded cursor-pointer"
              >
                Effacer
              </button>
            </div>
          </div>
          
          <div className="cyber-divider my-4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-cyber-yellow">
              <div className="w-2 h-2 bg-cyber-yellow rounded-full"></div>
              <span>Lignes: <strong>{macroStats.currentLineIndex}/{macroStats.totalLines}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-cyber-magenta">
              <span>Caractères: <strong className={macroStats.currentLineCharCount > (sndMode ? 512 : 180) ? 'text-red-500' : ''}>{macroStats.currentLineCharCount}/{sndMode ? 512 : 180}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-cyber-yellow">
              <Clock size={16} />
              <span>Temps cumulé: <strong>{formatTime(macroStats.cumulativeTime)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-cyber-magenta">
              <Clock size={16} />
              <span>Temps total: <strong>{formatTime(macroStats.totalTime)}</strong></span>
            </div>
          </div>
          
          {macroStats.hasErrors && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              <span>
                {macroStats.hasTooManyLines && 'Trop de lignes (max 15) • '}
                {macroStats.hasOverLimitLines && `Une ou plusieurs lignes dépassent ${sndMode ? 512 : 180} caractères • `}
                {macroStats.hasInvalidWait && 'Wait invalide détecté (max 60s)'}
              </span>
            </div>
          )}
          
          {sndMode && (
            <div className="mt-4 p-3 bg-cyber-yellow/10 border border-cyber-yellow/30 rounded text-xs text-cyber-yellow">
              <p className="mb-1 font-semibold">• Pour que la macro démarre avec du délai, faites : <span className="font-mono">/echo NOM DE LA MUSIQUE &lt;wait.XX&gt;</span></p>
              <p>• Les <span className="font-mono">&lt;wait.XX&gt;</span> doivent se trouver à la fin de la ligne. Ex : <span className="font-mono">/y emote &lt;wait.XX&gt;</span></p>
            </div>
          )}
        </div>
        
        <div className="cyber-panel p-6">
          <div className="relative w-full h-96 bg-black/50 border border-cyber-magenta/30 focus-within:border-cyber-magenta transition-colors rounded">
            <div 
              ref={highlightRef}
              className="absolute inset-0 px-4 py-3 font-mono text-sm overflow-auto whitespace-pre-wrap break-words pointer-events-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div dangerouslySetInnerHTML={{ __html: highlightSyntax(macroText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>') || '&nbsp;') }} />
            </div>
            <textarea
              ref={textareaRef}
              value={macroText}
              onChange={handleTextChange}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              onScroll={handleScroll}
              placeholder="/y [Emote] <wait.XX>&#10;/y Texte&#10;/dance"
              className="absolute inset-0 w-full h-full px-4 py-3 bg-transparent text-transparent caret-white placeholder-gray-600 focus:outline-none font-mono text-sm resize-none"
              style={{ caretColor: 'white' }}
              spellCheck="false"
            />
          </div>
        </div>
      </div>
      
      {showClearModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowClearModal(false)}>
          <div className="bg-black border-2 border-cyber-magenta p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-cyber-magenta mb-4">Supprimer ?</h3>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/50 transition-colors rounded cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={confirmClear}
                className="px-4 py-2 bg-cyber-magenta/20 hover:bg-cyber-magenta/30 text-cyber-magenta border border-cyber-magenta/50 transition-colors rounded cursor-pointer"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showCopySuccess && (
        <div className="fixed top-4 right-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded flex items-center gap-2 z-50">
          <Copy size={18} />
          <span className="font-semibold">Macro copiée !</span>
        </div>
      )}
    </div>
  )
}

export default FFXIVMacro
