import { useState } from 'react'

interface ExpandableTextProps {
  text: string
  maxLines?: number
  style?: React.CSSProperties
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({ 
  text, 
  maxLines = 4,
  style 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Calcular si el texto es muy largo (aproximadamente 150 caracteres por 4 líneas)
  const isLongText = text && text.length > 150
  
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <p 
        style={{
          ...style,
          margin: '0 0 0.5rem 0',
          overflow: isExpanded ? 'visible' : 'hidden',
          display: isExpanded ? 'block' : '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : maxLines,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.5',
        }}
      >
        {text}
      </p>
      {isLongText && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--guiasai-primary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: 0,
            textDecoration: 'underline',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--guiasai-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--guiasai-primary)'}
        >
          {isExpanded ? '↑ Ver menos' : '↓ Ver más'}
        </button>
      )}
    </div>
  )
}
