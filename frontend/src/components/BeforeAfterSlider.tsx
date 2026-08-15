import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

type ComponentProps = {
  beforeSrc: string;
  afterSrc: string;
}

export default function BeforeAfterSlider({ beforeSrc, afterSrc }: ComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50) // porcentaje
  const [containerWidth, setContainerWidth] = useState(0)
  const draggingRef = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onPointerDown = (e: PointerEvent) => {
    draggingRef.current = true
    updateFromClientX(e.clientX)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return
    updateFromClientX(e.clientX)
  }

  const onPointerUp = () => {
    draggingRef.current = false
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2))
    if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2))
  }

  return (
    <div className="comparator" ref={containerRef}>
      <img src={afterSrc} alt="Imagen mejorada" className="comparator__img" draggable={false} />
      <div className="comparator__before-wrap" style={{ width: `${position}%` }}>
        <img
          src={beforeSrc}
          alt="Imagen original"
          className="comparator__img comparator__img--before"
          style={{ width: containerWidth || '100%' }}
          draggable={false}
        />
      </div>

      <div className="comparator__labels">
        <span>Original</span>
        <span>Mejorada</span>
      </div>

      <div
        className="comparator__handle"
        style={{ left: `${position}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        role="slider"
        tabIndex={0}
        aria-label="Comparar imagen original y mejorada"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="comparator__handle-line" />
        <div className="comparator__handle-grip">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2L1 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 2L13 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}