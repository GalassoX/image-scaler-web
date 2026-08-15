import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import BeforeAfterSlider from './components/BeforeAfterSlider'
import UploadIcon from './components/UploadIcon'
import img from './assets/imagen-mejorada.png'
import './App.css'

// Cambia esto por la URL real de tu backend en Render una vez desplegado
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const MAX_FILE_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SCALE_OPTIONS = [2, 4]

enum ImageScalingStatus {
  Idle = 'idle',
  Processing = 'processing',
  Done = 'done',
  Error = 'error',
}

export default function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(img)
  const [scale, setScale] = useState(4)
  const [status, setStatus] = useState<ImageScalingStatus>(ImageScalingStatus.Idle)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const resetResult = () => {
    setResultUrl(null)
    setStatus(ImageScalingStatus.Idle)
    setErrorMsg('')
  }

  const handleFile = useCallback((file: File) => {
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg('Formato no soportado. Usa JPG, PNG o WEBP.')
      setStatus(ImageScalingStatus.Error)
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`El archivo supera el límite de ${MAX_FILE_SIZE_MB}MB.`)
      setStatus(ImageScalingStatus.Error)
      return
    }

    resetResult()
    setOriginalFile(file)
    setOriginalPreview(URL.createObjectURL(file))

    console.log(img)
    setResultUrl(img)
    setStatus(ImageScalingStatus.Done)
  }, [])

  const onInputChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    handleFile(e.target.files?.[0] as File)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const onProcess = async () => {
    if (!originalFile) return
    setStatus(ImageScalingStatus.Processing)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', originalFile)

    try {
      const res = await fetch(`${API_URL}/upscale?scale=${scale}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'No se pudo procesar la imagen.')
      }

      const blob = await res.blob()
      setResultUrl(URL.createObjectURL(blob))
      setStatus(ImageScalingStatus.Done)
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.')
      setStatus(ImageScalingStatus.Error)
    }
  }

  const onReset = () => {
    setOriginalFile(null)
    setOriginalPreview(null)
    resetResult()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__name">GLSX Tools</span>
        </div>
        <p className="header__tagline">Aumenta la calidad de tus imágenes gratis y en segundos</p>
      </header>

      <main className="main">
        {!originalPreview && (
          <div
            className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={onInputChange}
              hidden
            />
            <UploadIcon />
            <p className="dropzone__title">Suelta una imagen aquí</p>
            <p className="dropzone__subtitle">o haz clic para seleccionarla · JPG, PNG o WEBP · máx. {MAX_FILE_SIZE_MB}MB</p>
          </div>
        )}

        {originalPreview && status !== ImageScalingStatus.Done && (
          <div className="preview-panel">
            <div className="preview-panel__image-wrap">
              <img src={originalPreview} alt="Vista previa" className="preview-panel__image" />
            </div>

            <div className="controls">
              <div className="scale-toggle" role="radiogroup" aria-label="Factor de escala">
                {SCALE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={scale === s}
                    className={`scale-toggle__btn ${scale === s ? 'scale-toggle__btn--active' : ''}`}
                    onClick={() => setScale(s)}
                    disabled={status === ImageScalingStatus.Processing}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <div className="controls__actions">
                <button className="btn btn--ghost" onClick={onReset} disabled={status === ImageScalingStatus.Processing}>
                  Cambiar imagen
                </button>
                <button className="btn btn--primary" onClick={onProcess} disabled={status === ImageScalingStatus.Processing}>
                  {status === ImageScalingStatus.Processing ? 'Procesando…' : 'Mejorar imagen'}
                </button>
              </div>

              {status === ImageScalingStatus.Processing && (
                <p className="hint">Esto puede tardar entre 10 y 30 segundos.</p>
              )}
              {status === ImageScalingStatus.Error && <p className="error-text">{errorMsg}</p>}
            </div>
          </div>
        )}

        {status === ImageScalingStatus.Done && originalPreview && resultUrl && (
          <div className="result-panel">
            <div className="controls__actions controls__actions--result">
              <button className="btn btn--ghost" onClick={onReset}>
                Procesar otra imagen
              </button>
              <a className="btn btn--primary" href={resultUrl} download="imagen-mejorada.png">
                Descargar resultado
              </a>
            </div>
            <BeforeAfterSlider beforeSrc={originalPreview} afterSrc={resultUrl} />
          </div>
        )}
      </main>
    </div>
  )
}