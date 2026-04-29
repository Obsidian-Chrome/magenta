import React, { useState, useMemo, useRef } from 'react'
import { Clock, Copy, AlertCircle } from 'lucide-react'

function FFXIVMacro() {
  const [macroText, setMacroText] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef(null)
  
  const parseWaitTime = (line) => {
    const waitMatches = line.matchAll(/<wait\.(\d+)>/gi)
    let totalTime = 0
    for (const match of waitMatches) {
      const seconds = parseInt(match[1])
      totalTime += Math.min(seconds, 60) // Max 60 secondes par wait
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
    
    // Vérifier les erreurs
    const hasOverLimitLines = lines.some(line => line.length > 180)
    const hasTooManyLines = totalLines > 15
    
    // Détecter les wait > 60
    const hasInvalidWait = lines.some(line => {
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
  }, [macroText, cursorPosition])
  
  const handleTextChange = (e) => {
    setMacroText(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }
  
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart)
    }
  }
  
  const copyMacro = () => {
    navigator.clipboard.writeText(macroText)
  }
  
  const clearMacro = () => {
    setMacroText('')
    setCursorPosition(0)
  }
  
  return (
    <div className="space-y-6">
      <div className="max-w-full">
        <div className="cyber-panel p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-display font-black text-cyber-magenta">
              ÉDITEUR DE MACROS
            </h1>
            <div className="flex gap-2">
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
              <span>Caractères: <strong className={macroStats.currentLineCharCount > 180 ? 'text-red-500' : ''}>{macroStats.currentLineCharCount}/180</strong></span>
            </div>
            <div className="flex items-center gap-2 text-cyber-yellow">
              <Clock size={16} />
              <span>Temps cumulé: <strong>{macroStats.cumulativeTime}s</strong></span>
            </div>
            <div className="flex items-center gap-2 text-cyber-magenta">
              <Clock size={16} />
              <span>Temps total: <strong>{macroStats.totalTime}s</strong></span>
            </div>
          </div>
          
          {macroStats.hasErrors && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              <span>
                {macroStats.hasTooManyLines && 'Trop de lignes (max 15) • '}
                {macroStats.hasOverLimitLines && 'Une ou plusieurs lignes dépassent 180 caractères • '}
                {macroStats.hasInvalidWait && 'Wait invalide détecté (max 60s)'}
              </span>
            </div>
          )}
        </div>
        
        <div className="cyber-panel p-6">
          <textarea
            ref={textareaRef}
            value={macroText}
            onChange={handleTextChange}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            placeholder="/y [Emote]&#10;&lt;wait.XX&gt;&#10;/y Texte"
            className="w-full h-96 px-4 py-3 bg-black/50 text-white placeholder-gray-600 border border-cyber-magenta/30 focus:border-cyber-magenta focus:outline-none transition-colors font-mono text-sm resize-none"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  )
}

export default FFXIVMacro
