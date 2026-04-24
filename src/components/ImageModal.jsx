import { X } from 'lucide-react'

function ImageModal({ imageUrl, imageName, onClose }) {
  if (!imageUrl) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 hover:bg-cyber-magenta/20 transition-colors rounded-full"
      >
        <X size={32} className="text-cyber-magenta" />
      </button>
      
      <div 
        className="max-w-7xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cyber-panel p-6">
          <h3 className="text-2xl font-bold text-cyber-yellow mb-4">{imageName}</h3>
          <img 
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[75vh] object-contain corner-cut"
          />
        </div>
      </div>
    </div>
  )
}

export default ImageModal
