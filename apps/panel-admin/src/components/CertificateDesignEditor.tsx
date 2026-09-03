import React, { useState, useEffect, useRef } from "react"
import {
  Award,
  Save,
  X,
  Move,
  Download,
  Sparkles,
  Trash2,
  Type,
  Layers,
  Plus,
  Search,
  Image as ImageIcon,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Lock,
  Unlock,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaUploader } from "@/components/MediaUploader"
import { toast } from "sonner"
import QRCode from "qrcode"
import { useSearchParams } from "react-router-dom"
import { useThemeStore } from "@/store/theme.store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface TextElement {
  id: string
  label: string
  text: string
  x: number // 0-100 percentage
  y: number // 0-100 percentage
  fontSize: number // in px relative to 1920x1080
  fontFamily: string
  color: string
  align: "left" | "center" | "right"
  fontWeight: "normal" | "bold"
  showQr?: boolean
  qrSize?: number
  maxWidth?: number // width in percentage of template
  autoWidth?: boolean
  locked?: boolean
}

interface DesignSchema {
  width: number
  height: number
  pageSize?: "a4" | "a5"
  elements: TextElement[]
}

interface CertificateDesignEditorProps {
  templateName: string
  backgroundImageUrl: string
  designSchema: Record<string, any>
  onSave: (updates: { backgroundImageUrl: string; designSchema: Record<string, any> }) => Promise<void>
  onClose: () => void
}

const DEFAULT_SCHEMA: DesignSchema = {
  width: 1414,
  height: 1000,
  pageSize: "a4",
  elements: [
    {
      id: "title",
      label: "Título del Certificado",
      text: "Certificado de Participación",
      x: 50,
      y: 25,
      fontSize: 42,
      fontFamily: "Outfit",
      color: "#1e1b4b",
      align: "center",
      fontWeight: "bold",
      maxWidth: 80,
      autoWidth: true
    },
    {
      id: "recipient",
      label: "Nombre del Participante",
      text: "{{name}}",
      x: 50,
      y: 45,
      fontSize: 48,
      fontFamily: "Playfair Display",
      color: "#4338ca",
      align: "center",
      fontWeight: "bold",
      maxWidth: 85,
      autoWidth: true
    },
    {
      id: "description",
      label: "Descripción / Detalle",
      text: "Por completar exitosamente la edición anual de nuestro congreso de tecnología.",
      x: 50,
      y: 60,
      fontSize: 20,
      fontFamily: "Inter",
      color: "#4b5563",
      align: "center",
      fontWeight: "normal",
      maxWidth: 75,
      autoWidth: true
    },
    {
      id: "date",
      label: "Fecha / Ciudad",
      text: "Emitido el {{date}}",
      x: 50,
      y: 75,
      fontSize: 16,
      fontFamily: "Inter",
      color: "#6b7280",
      align: "center",
      fontWeight: "normal",
      maxWidth: 80,
      autoWidth: true
    },
    {
      id: "qr",
      label: "QR de Validación",
      text: "{{qr_code}}",
      x: 82,
      y: 80,
      fontSize: 14,
      fontFamily: "Courier",
      color: "#1e293b",
      align: "center",
      fontWeight: "normal",
      showQr: true,
      qrSize: 120
    }
  ]
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Moderna)" },
  { value: "Outfit", label: "Outfit (Elegante)" },
  { value: "Playfair Display", label: "Playfair Display (Serif/Clásica)" },
  { value: "Lora", label: "Lora (Literaria)" },
  { value: "Montserrat", label: "Montserrat (Llamativa)" },
  { value: "Poppins", label: "Poppins (Moderna/Redondeada)" },
  { value: "Courier New", label: "Courier (Técnica)" }
]

const COLOR_PRESETS = [
  "#1e1b4b", // Indigo oscuro
  "#4338ca", // Indigo medio
  "#0f172a", // Pizarra oscuro
  "#1e293b", // Slate oscuro
  "#16a34a", // Verde
  "#dc2626", // Rojo
  "#b45309", // Ámbar
  "#06b6d4"  // Cian
]

const getTransform = (align: string) => {
  if (align === "left") return "translate(0%, -50%)"
  if (align === "right") return "translate(-100%, -50%)"
  return "translate(-50%, -50%)"
}

function drawTextWithWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ")
  let line = ""
  const lines = []

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim())
      line = words[n] + " "
    } else {
      line = testLine
    }
  }
  lines.push(line.trim())

  const totalHeight = (lines.length - 1) * lineHeight
  let currentY = y - totalHeight / 2

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, currentY)
    currentY += lineHeight
  }
}

interface QrPreviewSvgProps {
  size: number
  color: string
  seed: string
}

export function QrPreviewSvg({ color, seed: code }: QrPreviewSvgProps) {
  try {
    const validationUrl = `${window.location.origin}/validar/${code}`
    const qr = QRCode.create(validationUrl, { errorCorrectionLevel: "M" })
    const gridCount = qr.modules.size
    const qrData = qr.modules.data

    const rects: React.ReactNode[] = []

    for (let r = 0; r < gridCount; r++) {
      for (let c = 0; c < gridCount; c++) {
        const isDark = qrData[r * gridCount + c] === 1
        if (isDark) {
          rects.push(
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              fill={color}
            />
          )
        }
      }
    }

    return (
      <div className="flex flex-col items-center select-none w-full h-full">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${gridCount} ${gridCount}`}
          style={{ display: "block", backgroundColor: "#ffffff" }}
        >
          {rects}
        </svg>
        <span
          className="font-mono mt-1 text-center block select-none pointer-events-none"
          style={{
            color: color,
            fontSize: "6px",
            lineHeight: "1.2",
            fontWeight: "bold"
          }}
        >
          {code}
        </span>
      </div>
    )
  } catch (err) {
    console.error("Error generating preview QR SVG:", err)
    return null
  }
}

export function drawProfessionalQR(
  ctx: CanvasRenderingContext2D,
  xPx: number,
  yPx: number,
  qrSize: number,
  color: string,
  qrValue: string,
  label: string
) {
  try {
    const qr = QRCode.create(qrValue, { errorCorrectionLevel: "M" })
    const gridCount = qr.modules.size
    const qrData = qr.modules.data
    const moduleSize = qrSize / gridCount

    const qrX = xPx - qrSize / 2
    const qrY = yPx - qrSize / 2

    // Draw background white box
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(qrX, qrY, qrSize, qrSize)

    // Draw dark modules
    ctx.fillStyle = color
    for (let r = 0; r < gridCount; r++) {
      for (let c = 0; c < gridCount; c++) {
        const isDark = qrData[r * gridCount + c] === 1
        if (isDark) {
          ctx.fillRect(
            Math.round(qrX + c * moduleSize),
            Math.round(qrY + r * moduleSize),
            Math.ceil(moduleSize),
            Math.ceil(moduleSize)
          )
        }
      }
    }

    // Draw validation code underneath the QR code
    ctx.font = `12px monospace`
    ctx.fillStyle = color
    ctx.textAlign = "center"
    ctx.fillText(label, xPx, qrY + qrSize + 18)
  } catch (err) {
    console.error("Error generating scannable QR: ", err)
  }
}

export function CertificateDesignEditor({
  templateName,
  backgroundImageUrl: initialBgUrl,
  designSchema: initialSchema,
  onSave,
  onClose
}: CertificateDesignEditorProps) {
  const [bgUrl, setBgUrl] = useState(initialBgUrl || "")
  
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === "dark"

  const [scale, setScale] = useState(0.5)
  
  const [schema, setSchemaState] = useState<DesignSchema>(() => {
    if (initialSchema && Array.isArray(initialSchema.elements)) {
      return initialSchema as DesignSchema
    }
    return DEFAULT_SCHEMA
  })

  // Tracking changes for unsaved changes confirmation dialog
  const [lastSavedBgUrl, setLastSavedBgUrl] = useState(initialBgUrl || "")
  const [lastSavedSchema, setLastSavedSchema] = useState<DesignSchema>(() => {
    if (initialSchema && Array.isArray(initialSchema.elements)) {
      return JSON.parse(JSON.stringify(initialSchema)) as DesignSchema
    }
    return JSON.parse(JSON.stringify(DEFAULT_SCHEMA))
  })
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false)

  const hasChanges = bgUrl !== lastSavedBgUrl || JSON.stringify(schema) !== JSON.stringify(lastSavedSchema)

  const handleRequestClose = () => {
    if (hasChanges) {
      setIsCloseConfirmationOpen(true)
    } else {
      onClose()
    }
  }

  // References for managing history (undo/redo stack)
  const historyRef = useRef<DesignSchema[]>([])
  const historyIndexRef = useRef<number>(-1)

  const pushToHistory = (newSchema: DesignSchema) => {
    const currentHistory = historyRef.current
    const currentIndex = historyIndexRef.current

    // Truncate any future history (for redo after undo)
    const nextHistory = currentHistory.slice(0, currentIndex + 1)
    
    // Avoid pushing duplicate states
    const lastEntry = nextHistory[nextHistory.length - 1]
    if (lastEntry && JSON.stringify(lastEntry) === JSON.stringify(newSchema)) {
      return
    }

    nextHistory.push(newSchema)
    historyRef.current = nextHistory
    historyIndexRef.current = nextHistory.length - 1
  }

  // Ensure initial history entry is populated with the initial state
  const ensureInitialHistory = (initialState: DesignSchema) => {
    if (historyRef.current.length === 0) {
      historyRef.current = [initialState]
      historyIndexRef.current = 0
    }
  }

  // Schema state update wrapper that records history
  const setSchema = (
    value: DesignSchema | ((prev: DesignSchema) => DesignSchema),
    shouldPushToHistory = true
  ) => {
    setSchemaState((prev) => {
      ensureInitialHistory(prev)
      const next = typeof value === "function" ? value(prev) : value
      if (shouldPushToHistory) {
        pushToHistory(next)
      }
      return next
    })
  }

  const handleUndo = () => {
    const currentIndex = historyIndexRef.current
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1
      const previousState = historyRef.current[nextIndex]
      historyIndexRef.current = nextIndex
      setSchemaState(previousState)
      toast.success("Deshecho")
    } else {
      toast.info("No hay más cambios para deshacer")
    }
  }

  const handleRedo = () => {
    const currentIndex = historyIndexRef.current
    const currentHistory = historyRef.current
    if (currentIndex < currentHistory.length - 1) {
      const nextIndex = currentIndex + 1
      const nextState = currentHistory[nextIndex]
      historyIndexRef.current = nextIndex
      setSchemaState(nextState)
      toast.success("Rehecho")
    } else {
      toast.info("No hay cambios para rehacer")
    }
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get("tab") as "background" | "text" | "layers") || "text"
  const setActiveTab = (tab: "background" | "text" | "layers") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("tab", tab)
      return next
    })
  }

  const [activeElementId, setActiveElementId] = useState<string>("recipient")
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [copiedElement, setCopiedElement] = useState<TextElement | null>(null)
  const [editingElementId, setEditingElementId] = useState<string | null>(null)

  const selectedFormat = schema.pageSize || "a4"

  const handleFormatChange = (format: "a4" | "a5") => {
    setSchema(prev => ({
      ...prev,
      pageSize: format
    }))
  }

  const handleAddTextElement = (text: string, fontSize: number, fontWeight: "normal" | "bold") => {
    const newId = `custom_${Date.now()}`
    const labelNum = schema.elements.filter(e => e.id.startsWith("custom")).length + 1
    const newElement: TextElement = {
      id: newId,
      label: `Texto ${labelNum}`,
      text: text,
      x: 50,
      y: 50,
      fontSize: fontSize,
      fontFamily: "Poppins",
      color: "#1e293b",
      align: "center",
      fontWeight: fontWeight,
      maxWidth: 80,
      autoWidth: true
    }
    setSchema((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }))
    setActiveElementId(newId)
    toast.success(`Elemento "${newElement.label}" añadido.`)
  }

  const handleToggleQR = () => {
    const qrExists = schema.elements.some(el => el.id === "qr")
    if (qrExists) {
      setSchema(prev => ({
        ...prev,
        elements: prev.elements.map(el => {
          if (el.id === "qr") {
            const nextShow = !el.showQr
            toast.success(nextShow ? "QR de validación activado" : "QR de validación desactivado")
            return { ...el, showQr: nextShow }
          }
          return el
        })
      }))
    } else {
      const newQr: TextElement = {
        id: "qr",
        label: "QR de Validación",
        text: "{{qr_code}}",
        x: 82,
        y: 80,
        fontSize: 14,
        fontFamily: "Courier",
        color: "#1e293b",
        align: "center",
        fontWeight: "normal",
        showQr: true,
        qrSize: 120
      }
      setSchema(prev => ({
        ...prev,
        elements: [...prev.elements, newQr]
      }))
      setActiveElementId("qr")
      toast.success("QR de validación añadido al diseño.")
    }
  }

  // Dynamically load Google Fonts for the preview
  useEffect(() => {
    const link = document.createElement("link")
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700&family=Outfit:wght@400;700&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Poppins:wght@400;600;700&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Dynamically calculate the scale factor of the canvas preview relative to design dimensions
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.clientWidth
        const currentScale = width / (schema.width || 1414)
        setScale(currentScale)
      }
    }

    handleResize()

    // Observe size changes of the canvas itself (e.g. sidebar toggle, screen resize)
    let observer: ResizeObserver | null = null
    if (canvasRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        handleResize()
      })
      observer.observe(canvasRef.current)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [schema.width, bgUrl])

  const activeElement = schema.elements.find((el) => el.id === activeElementId) || schema.elements[0]

  const getNewXForAlignment = (
    currentX: number,
    oldAlign: "left" | "center" | "right",
    newAlign: "left" | "center" | "right",
    elementId: string
  ): number => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return currentX

    const domEl = canvasEl.querySelector(`[data-element-id="${elementId}"]`)
    if (!domEl) return currentX

    const rect = domEl.getBoundingClientRect()
    const canvasRect = canvasEl.getBoundingClientRect()
    const widthPercent = (rect.width / canvasRect.width) * 100

    // Calculate current visual center (centerX)
    let centerX = currentX
    if (oldAlign === "left") {
      centerX = currentX + widthPercent / 2
    } else if (oldAlign === "right") {
      centerX = currentX - widthPercent / 2
    }

    // Calculate new X based on new alignment
    let newX = centerX
    if (newAlign === "left") {
      newX = centerX - widthPercent / 2
    } else if (newAlign === "right") {
      newX = centerX + widthPercent / 2
    }

    return Math.max(0, Math.min(100, Number(newX.toFixed(2))))
  }

  const handleUpdateActiveElement = (updates: Partial<TextElement>) => {
    setSchema((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => {
        if (el.id === activeElementId) {
          let updatedEl = { ...el, ...updates }
          if (updates.align && updates.align !== el.align) {
            const newX = getNewXForAlignment(el.x, el.align, updates.align, el.id)
            updatedEl.x = newX
          }
          return updatedEl
        }
        return el
      })
    }))
  }

  const handleToggleLockElement = (id: string) => {
    setSchema((prev) => {
      const nextElements = prev.elements.map((el) => {
        if (el.id === id) {
          const nextLocked = !el.locked
          toast.success(nextLocked ? `Elemento "${el.label}" bloqueado` : `Elemento "${el.label}" desbloqueado`)
          return { ...el, locked: nextLocked }
        }
        return el
      })
      return { ...prev, elements: nextElements }
    }, true)
  }

  const handleDuplicateElement = (id: string) => {
    const element = schema.elements.find((el) => el.id === id)
    if (!element) return
    const newId = `custom_${Date.now()}`
    const duplicatedElement: TextElement = {
      ...element,
      id: newId,
      label: `${element.label} (Copia)`,
      x: Math.min(95, element.x + 2),
      y: Math.min(95, element.y + 2),
      locked: false // Reset locked state for copy
    }
    setSchema((prev) => ({
      ...prev,
      elements: [...prev.elements, duplicatedElement]
    }))
    setActiveElementId(newId)
    toast.success("Elemento duplicado")
  }

  const handleSave = async () => {
    if (!bgUrl) {
      toast.error("Por favor, sube una imagen de fondo para el certificado.")
      return
    }
    setIsSaving(true)
    try {
      await onSave({
        backgroundImageUrl: bgUrl,
        designSchema: schema
      })
      setLastSavedBgUrl(bgUrl)
      setLastSavedSchema(schema)
      toast.success("Diseño del certificado guardado correctamente.")
    } catch (err: any) {
      console.error(err)
      toast.error("Error al guardar el diseño.")
    } finally {
      setIsSaving(false)
    }
  }

  // Keyboard Shortcuts & Navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Avoid blocking standard input typing
      const target = e.target as HTMLElement
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable

      const activeElement = schema.elements.find((el) => el.id === activeElementId)

      // Ctrl+S / Cmd+S to Save Certificate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        handleSave()
        return
      }

      // If user is actively typing in a form input, do not trigger shortcuts
      if (isInput) return

      // Undo (Ctrl+Z / Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      // Redo (Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z)
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault()
        handleRedo()
        return
      }

      // Copy (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (activeElement) {
          e.preventDefault()
          setCopiedElement(activeElement)
          toast.success(`Copiado: ${activeElement.label}`)
        }
        return
      }

      // Cut (Ctrl+X / Cmd+X)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        if (activeElement) {
          e.preventDefault()
          setCopiedElement(activeElement)
          if (schema.elements.length <= 1) {
            toast.error("Debe haber al menos un elemento en el certificado.")
            return
          }
          const filtered = schema.elements.filter((el) => el.id !== activeElementId)
          setSchema((prev) => ({ ...prev, elements: filtered }))
          setActiveElementId(filtered[0]?.id || "")
          toast.success(`Cortado: ${activeElement.label}`)
        }
        return
      }

      // Paste (Ctrl+V / Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (copiedElement) {
          e.preventDefault()
          const newId = `custom_${Date.now()}`
          const pastedElement: TextElement = {
            ...copiedElement,
            id: newId,
            label: `${copiedElement.label} (Copia)`,
            x: Math.min(95, copiedElement.x + 2),
            y: Math.min(95, copiedElement.y + 2)
          }
          setSchema((prev) => ({
            ...prev,
            elements: [...prev.elements, pastedElement]
          }))
          setActiveElementId(newId)
          toast.success("Elemento pegado")
        }
        return
      }

      // Duplicate (Ctrl+D / Cmd+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (activeElement) {
          e.preventDefault()
          const newId = `custom_${Date.now()}`
          const duplicatedElement: TextElement = {
            ...activeElement,
            id: newId,
            label: `${activeElement.label} (Copia)`,
            x: Math.min(95, activeElement.x + 2),
            y: Math.min(95, activeElement.y + 2)
          }
          setSchema((prev) => ({
            ...prev,
            elements: [...prev.elements, duplicatedElement]
          }))
          setActiveElementId(newId)
          toast.success("Elemento duplicado")
        }
        return
      }

      // Delete / Backspace to Delete Element
      if (activeElementId && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault()
        if (schema.elements.length <= 1) {
          toast.error("Debe haber al menos un elemento en el certificado.")
          return
        }
        const filtered = schema.elements.filter((el) => el.id !== activeElementId)
        setSchema((prev) => ({ ...prev, elements: filtered }))
        setActiveElementId(filtered[0]?.id || "")
        toast.success("Elemento eliminado")
        return
      }

      // Arrow keys to nudge active element position
      if (activeElementId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        const step = e.shiftKey ? 2 : 0.5 // Shift for bigger steps
        const element = schema.elements.find((el) => el.id === activeElementId)
        if (!element) return

        let newX = element.x
        let newY = element.y

        if (e.key === "ArrowLeft") newX = Math.max(0, element.x - step)
        if (e.key === "ArrowRight") newX = Math.min(100, element.x + step)
        if (e.key === "ArrowUp") newY = Math.max(0, element.y - step)
        if (e.key === "ArrowDown") newY = Math.min(100, element.y + step)

        handleUpdateActiveElement({
          x: Number(newX.toFixed(2)),
          y: Number(newY.toFixed(2))
        })
        return
      }

      // Escape to clear selection
      if (e.key === "Escape") {
        setActiveElementId("")
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeElementId, schema.elements, bgUrl, copiedElement])

  // Client-side download function
  const handleTestDownload = (format: "png" | "pdf") => {
    if (!bgUrl) {
      toast.error("Sube un fondo primero para poder descargar una prueba.")
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = bgUrl
    toast.loading("Renderizando vista previa para descarga...", { id: "rendering-cert" })

    img.onload = async () => {
      // Ensure all custom fonts are loaded so canvas matches preview typography
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready
      }

      const canvas = document.createElement("canvas")
      canvas.width = schema.width
      canvas.height = schema.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        toast.error("No se pudo obtener el contexto del canvas.")
        toast.dismiss("rendering-cert")
        return
      }

      // Draw background
      ctx.drawImage(img, 0, 0, schema.width, schema.height)

      // Draw elements
      schema.elements.forEach((el) => {
        if (el.id === "qr" && !el.showQr) return

        const xPx = (el.x / 100) * schema.width
        const yPx = (el.y / 100) * schema.height

        if (el.id === "qr" && el.showQr) {
          const qrSize = el.qrSize || 120
          const validationCode = "TEST-VALIDATION"
          const validationUrl = `${window.location.origin}/validar/${validationCode}`
          drawProfessionalQR(ctx, xPx, yPx, qrSize, el.color || "#000000", validationUrl, validationCode)
          return
        }

        // Apply styles
        const weight = el.fontWeight === "bold" ? "bold" : "normal"
        ctx.font = `${weight} ${el.fontSize}px "${el.fontFamily}"`
        ctx.fillStyle = el.color
        ctx.textAlign = el.align

        // Replace placeholders for test
        let text = el.text
        if (text.includes("{{name}}")) {
          text = text.replace("{{name}}", "JUAN PEREZ ALVARADO")
        }
        if (text.includes("{{date}}")) {
          text = text.replace("{{date}}", new Date().toLocaleDateString("es-ES"))
        }

        const isAuto = el.autoWidth ?? true
        if (isAuto) {
          ctx.fillText(text, xPx, yPx)
        } else {
          const elMaxWidth = ((el.maxWidth || 80) / 100) * schema.width
          const lineHeight = el.fontSize * 1.25
          drawTextWithWrap(ctx, text, xPx, yPx, elMaxWidth, lineHeight)
        }
      })

      // Trigger download
      if (format === "png") {
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `CERT-PRUEBA-${templateName.replace(/\s+/g, "_").toUpperCase()}.png`
        link.href = dataUrl
        link.click()
        toast.success("Muestra de certificado descargada como imagen (PNG).", { id: "rendering-cert" })
      } else {
        const { jsPDF } = await import("jspdf")
        const pageSize = schema.pageSize || "a4"
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: pageSize
        })
        const imgData = canvas.toDataURL("image/png")
        const pdfWidth = pageSize === "a5" ? 210 : 297
        const pdfHeight = pageSize === "a5" ? 148.5 : 210
        doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
        doc.save(`CERT-PRUEBA-${templateName.replace(/\s+/g, "_").toUpperCase()}.pdf`)
        toast.success(`Muestra de certificado descargada como PDF (${pageSize.toUpperCase()}).`, { id: "rendering-cert" })
      }
    }

    img.onerror = () => {
      toast.error("Error al cargar la imagen de fondo para renderizado. Asegúrate de que no haya problemas de CORS.", { id: "rendering-cert" })
    }
  }

  // Handle Dragging elements inside preview
  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const element = schema.elements.find((el) => el.id === id)
    if (!element) return
    setActiveElementId(id)

    if (element.locked) return

    const canvasBounds = canvasRef.current?.getBoundingClientRect()
    if (!canvasBounds) return

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const relativeX = ((moveEvent.clientX - canvasBounds.left) / canvasBounds.width) * 100
      const relativeY = ((moveEvent.clientY - canvasBounds.top) / canvasBounds.height) * 100

      // Constrain within 0-100%
      const constrainedX = Math.max(0, Math.min(100, Math.round(relativeX * 10) / 10))
      const constrainedY = Math.max(0, Math.min(100, Math.round(relativeY * 10) / 10))

      setSchema((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, x: constrainedX, y: constrainedY } : el
        )
      }), false)
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      // Save final dragged position to history
      setSchema((prev) => prev, true)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // Handle Resizing font size using corner handles
  const handleResizeFontSizeStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const element = schema.elements.find((el) => el.id === id)
    if (!element || element.locked) return

    const startX = e.clientX
    const startY = e.clientY
    const startFontSize = element.fontSize

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      // Determine dominant delta to control resizing directionally
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
      // Convert drag delta back to font size pixels using current scale factor
      const nextFontSize = Math.round(startFontSize + (delta / scale) * 0.25)
      const constrainedFontSize = Math.max(8, Math.min(180, nextFontSize))

      setSchema((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, fontSize: constrainedFontSize } : el
        )
      }), false)
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      setSchema((prev) => prev, true) // Save to history
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // Handle Resizing width using left/right side handles
  const handleResizeWidthStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const element = schema.elements.find((el) => el.id === id)
    if (!element || element.locked) return

    const canvasBounds = canvasRef.current?.getBoundingClientRect()
    if (!canvasBounds) return

    // Immediately toggle off autoWidth on resize start
    setSchema((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, autoWidth: false, maxWidth: el.maxWidth || 80 } : el
      )
    }), false)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentMouseXPercent = ((moveEvent.clientX - canvasBounds.left) / canvasBounds.width) * 100
      
      // Calculate new width according to alignment
      let newMaxWidth = element.maxWidth || 80
      if (element.align === "left") {
        newMaxWidth = currentMouseXPercent - element.x
      } else if (element.align === "center") {
        newMaxWidth = 2 * Math.abs(currentMouseXPercent - element.x)
      } else if (element.align === "right") {
        newMaxWidth = element.x - currentMouseXPercent
      }

      // Constrain width percentage between 10% and 100%
      const constrainedMaxWidth = Math.max(10, Math.min(100, Math.round(newMaxWidth)))

      setSchema((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, maxWidth: constrainedMaxWidth } : el
        )
      }), false)
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      setSchema((prev) => prev, true) // Save to history
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col animate-in fade-in duration-300 font-sans selection:bg-indigo-500/30 selection:text-white ${isDark ? "bg-[#0f172a]/95 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      {/* Editor Header */}
      <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 shadow-lg relative z-20 backdrop-blur-md ${isDark ? "border-slate-800 bg-[#1e293b]/90 text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={`font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`}>Diseñador de Certificados</h1>
            <p className="text-[10px] text-indigo-400 mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>{templateName}</span>
              <span className="h-1 w-1 rounded-full bg-slate-600"></span>
              <span className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-[8px] border border-indigo-500/20">
                {selectedFormat.toUpperCase()} Horizontal
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDownloadModalOpen(true)}
            className={`text-xs gap-1.5 cursor-pointer border ${isDark ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white" : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-850"}`}
          >
            <Download className="size-4 text-indigo-450" />
            Descargar Muestra
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 border-0"
          >
            <Save className="size-4" />
            {isSaving ? "Guardando..." : "Guardar Diseño"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRequestClose}
            className={`rounded-full size-8 flex items-center justify-center transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"}`}
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      {/* Editor Body */}
      <div className={`flex-1 flex overflow-hidden relative z-10 ${isDark ? "bg-[#090d16]" : "bg-slate-200"}`}>
        {/* Leftmost Narrow Icon Sidebar */}
        <div className={`w-20 border-r flex flex-col items-center py-6 gap-6 shrink-0 select-none ${isDark ? "bg-[#111827] border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
          <button
            onClick={() => setActiveTab("background")}
            className={`flex flex-col items-center gap-2 w-full py-3.5 text-center cursor-pointer transition-all relative ${
              activeTab === "background"
                ? "text-indigo-500 font-bold bg-indigo-500/10"
                : isDark
                ? "text-slate-500 hover:text-slate-300"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            {activeTab === "background" && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r" />
            )}
            <ImageIcon className="size-5" />
            <span className="text-[9px] tracking-wider uppercase font-semibold">Lienzo</span>
          </button>

          <button
            onClick={() => setActiveTab("text")}
            className={`flex flex-col items-center gap-2 w-full py-3.5 text-center cursor-pointer transition-all relative ${
              activeTab === "text"
                ? "text-indigo-500 font-bold bg-indigo-500/10"
                : isDark
                ? "text-slate-500 hover:text-slate-300"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            {activeTab === "text" && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r" />
            )}
            <Type className="size-5" />
            <span className="text-[9px] tracking-wider uppercase font-semibold">Textos</span>
          </button>

          <button
            onClick={() => setActiveTab("layers")}
            className={`flex flex-col items-center gap-2 w-full py-3.5 text-center cursor-pointer transition-all relative ${
              activeTab === "layers"
                ? "text-indigo-500 font-bold bg-indigo-500/10"
                : isDark
                ? "text-slate-500 hover:text-slate-300"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            {activeTab === "layers" && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r" />
            )}
            <Layers className="size-5" />
            <span className="text-[9px] tracking-wider uppercase font-semibold">Capas</span>
          </button>
        </div>

        {/* Control Panel Details Sidebar */}
        <aside className={`w-80 backdrop-blur-md border-r p-5 flex flex-col gap-6 overflow-y-auto shrink-0 relative ${isDark ? "bg-[#1f2937]/65 border-slate-800/80 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
          {activeTab === "background" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="space-y-2">
                <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Tamaño del Certificado</h3>
                <p className={`text-[10px] leading-normal ${isDark ? "text-slate-500" : "text-slate-600"}`}>Determina las proporciones físicas para la exportación y visualización.</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => handleFormatChange("a4")}
                    className={`flex flex-col justify-center items-center py-4 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === "a4"
                        ? "border-indigo-500 bg-indigo-500/15 text-indigo-500 font-bold shadow-md shadow-indigo-500/5"
                        : isDark
                        ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-xs">A4 Horizontal</span>
                    <span className="text-[8px] opacity-80 mt-0.5">297 x 210 mm (A4)</span>
                  </button>
                  <button
                    onClick={() => handleFormatChange("a5")}
                    className={`flex flex-col justify-center items-center py-4 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === "a5"
                        ? "border-indigo-500 bg-indigo-500/15 text-indigo-500 font-bold shadow-md shadow-indigo-500/5"
                        : isDark
                        ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-xs">A5 Horizontal</span>
                    <span className="text-[8px] opacity-80 mt-0.5">210 x 148 mm (A5)</span>
                  </button>
                </div>
              </div>

              <div className={`border-t pt-6 space-y-3 ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Fondo del Certificado</h3>
                <p className={`text-[10px] leading-normal ${isDark ? "text-slate-500" : "text-slate-600"}`}>Carga la plantilla de diseño base sin los textos dinámicos.</p>
                <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                  <MediaUploader
                    label="Imagen de Fondo"
                    value={bgUrl}
                    onChange={setBgUrl}
                    variant="banner"
                    folder="certificates"
                    identifier="bg"
                    placeholder="Sube el archivo base"
                  />
                </div>
                <div className={`text-[10px] border rounded-lg p-3 leading-relaxed ${isDark ? "text-slate-350 bg-indigo-950/20 border-indigo-900/30" : "text-indigo-900 bg-indigo-50/50 border-indigo-100"}`}>
                  <span className="font-bold text-indigo-400 block mb-0.5">Recomendación técnica:</span>
                  Usa imágenes en formato PNG o JPG de alta resolución con proporción **1.414** (por ejemplo, 1414 x 1000 píxeles) para que encaje perfectamente con las hojas A4/A5.
                </div>
              </div>
            </div>
          )}

          {activeTab === "text" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Busca fuentes y combinaciones"
                  className={`w-full h-9 rounded-lg border pl-9 pr-3 text-xs focus:outline-hidden focus:border-indigo-500 ${isDark ? "border-slate-800 bg-slate-900/60 text-slate-300 placeholder:text-slate-600" : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"}`}
                  disabled
                />
              </div>

              <button
                onClick={() => handleAddTextElement("Texto de Muestra", 24, "normal")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-101 hover:shadow-lg hover:shadow-indigo-600/15 text-xs border-0"
              >
                <Plus className="size-4" />
                Agregar caja de texto
              </button>

              <div className="space-y-3">
                <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Estilos de texto predeterminados</h3>

                <button
                  onClick={() => handleAddTextElement("Agregar un título", 48, "bold")}
                  className={`w-full text-left p-3.5 border rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group ${isDark ? "bg-slate-900/50 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                >
                  <span className="block font-bold text-base leading-none group-hover:text-indigo-400 transition-colors">Agregar un título</span>
                </button>

                <button
                  onClick={() => handleAddTextElement("Agregar un subtítulo", 28, "normal")}
                  className={`w-full text-left p-3 border rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group ${isDark ? "bg-slate-900/50 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                >
                  <span className="block font-medium text-xs leading-none group-hover:text-indigo-400 transition-colors">Agregar un subtítulo</span>
                </button>

                <button
                  onClick={() => handleAddTextElement("Agregar algo de texto", 18, "normal")}
                  className={`w-full text-left p-2.5 border rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group ${isDark ? "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200" : "bg-slate-50 border-slate-200 text-slate-505 hover:text-slate-700"}`}
                >
                  <span className="block text-[10px] leading-none transition-colors">Agregar texto de cuerpo</span>
                </button>
              </div>

              <div className={`border-t pt-5 space-y-3 ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Campos Dinámicos (Zynqro)</h3>
                <p className={`text-[10px] leading-normal ${isDark ? "text-slate-500" : "text-slate-600"}`}>Variables de autocompletado en certificados reales:</p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleAddTextElement("{{name}}", 48, "bold")}
                    className={`flex items-center justify-between text-left p-2.5 border hover:border-indigo-500 hover:bg-indigo-500/5 rounded-xl text-xs cursor-pointer transition-colors ${isDark ? "bg-slate-900/40 border-slate-800/80 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                  >
                    <span>Nombre del Participante</span>
                    <span className="font-mono text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md border border-indigo-500/20 font-bold uppercase">NAME</span>
                  </button>

                  <button
                    onClick={() => handleAddTextElement("Emitido el {{date}}", 18, "normal")}
                    className={`flex items-center justify-between text-left p-2.5 border hover:border-indigo-500 hover:bg-indigo-500/5 rounded-xl text-xs cursor-pointer transition-colors ${isDark ? "bg-slate-900/40 border-slate-800/80 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                  >
                    <span>Fecha de Emisión</span>
                    <span className="font-mono text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20 font-bold uppercase">DATE</span>
                  </button>

                  <button
                    onClick={handleToggleQR}
                    className={`flex items-center justify-between text-left p-2.5 border rounded-xl text-xs cursor-pointer transition-all ${
                      schema.elements.some(el => el.id === "qr" && el.showQr)
                        ? "border-emerald-500 bg-emerald-500/5 text-emerald-450 font-bold"
                        : isDark
                        ? "border-slate-800 bg-slate-900/40 hover:border-indigo-500 hover:bg-indigo-500/5 text-slate-300"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-500/5 text-slate-700"
                    }`}
                  >
                    <span>{schema.elements.some(el => el.id === "qr" && el.showQr) ? "QR de Validación (Activo)" : "Activar QR de Validación"}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border ${
                      schema.elements.some(el => el.id === "qr" && el.showQr)
                        ? "bg-emerald-500/25 border-emerald-500/20 text-emerald-300"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}>QR</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "layers" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
              <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Capas de la Plantilla</h3>
              {schema.elements.length === 0 ? (
                <p className={`text-xs italic ${isDark ? "text-slate-600" : "text-slate-400"}`}>No hay capas agregadas en esta plantilla.</p>
              ) : (
                <div className="space-y-2">
                  {schema.elements.map((el) => {
                    const isActive = el.id === activeElementId
                    return (
                      <div
                        key={el.id}
                        onClick={() => setActiveElementId(el.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? "border-indigo-500 bg-indigo-500/10 font-bold shadow-md"
                            : isDark
                            ? "border-slate-800 bg-slate-900/30 hover:bg-slate-850"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${el.id === "qr"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                            : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                            }`}>
                            {el.id === "qr" ? "QR" : "TXT"}
                          </span>
                          <span className={`text-xs truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>{el.label}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (schema.elements.length <= 1) {
                              toast.error("Debe haber al menos un elemento en el certificado.")
                              return
                            }
                            const filtered = schema.elements.filter((item) => item.id !== el.id)
                            setSchema(prev => ({ ...prev, elements: filtered }))
                            if (isActive) {
                              setActiveElementId(filtered[0].id)
                            }
                            toast.success("Elemento eliminado de la plantilla.")
                          }}
                          className="h-6 w-6 rounded-md hover:bg-destructive/10 text-slate-500 hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
                          title="Eliminar elemento"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Visual Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Horizontal Contextual Toolbar */}
          <div className={`h-14 border-b px-6 flex items-center justify-between gap-4 select-none shrink-0 shadow-md relative z-10 ${isDark ? "border-slate-800/80 bg-[#111827]" : "border-slate-200 bg-slate-50"}`}>
            {activeElement ? (
              <div className="flex items-center gap-4 text-xs w-full justify-between animate-in fade-in duration-200">

                {/* Left group: Font, Size, Color, Weight, Align */}
                <div className="flex items-center gap-3">
                  {/* Custom Layer/Element Name */}
                  <div className={`flex items-center gap-1.5 pr-3 border-r animate-in slide-in-from-left-2 duration-200 ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Nombre:</span>
                    <input
                      type="text"
                      className={`h-8 px-2.5 w-28 text-xs border rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold ${isDark ? "border-slate-800 bg-slate-900 text-slate-200" : "border-slate-250 bg-white text-slate-850"}`}
                      value={activeElement.label}
                      onChange={(e) => handleUpdateActiveElement({ label: e.target.value })}
                      placeholder="Nombre..."
                      title="Editar nombre personalizado de la capa"
                    />
                  </div>

                  {activeElement.id !== "qr" ? (
                    <>
                      {/* Custom Text Content */}
                      <div className={`flex items-center gap-1.5 pr-3 border-r animate-in slide-in-from-left-2 duration-200 ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Texto:</span>
                        <input
                          type="text"
                          className={`h-8 px-2.5 w-40 text-xs border rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold ${isDark ? "border-slate-800 bg-slate-900 text-slate-200" : "border-slate-250 bg-white text-slate-850"}`}
                          value={activeElement.text}
                          onChange={(e) => handleUpdateActiveElement({ text: e.target.value })}
                          placeholder="Texto..."
                          title="Editar el contenido del texto"
                        />
                      </div>

                      {/* Font Family select */}
                      <select
                        className={`rounded-lg border text-xs font-semibold px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 cursor-pointer ${isDark ? "border-slate-800 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-800"}`}
                        value={activeElement.fontFamily}
                        onChange={(e) => handleUpdateActiveElement({ fontFamily: e.target.value })}
                      >
                        {FONT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Font Size controls */}
                      <div className={`flex items-center border rounded-lg overflow-hidden h-8 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-250 bg-white"}`}>
                        <button
                          className={`px-2.5 font-bold h-full border-r cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300 border-slate-800 active:bg-slate-700" : "hover:bg-slate-100 text-slate-600 border-slate-200 active:bg-slate-200"}`}
                          onClick={() => handleUpdateActiveElement({ fontSize: Math.max(10, activeElement.fontSize - 2) })}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className={`w-10 text-center text-xs h-full border-0 focus:ring-0 bg-transparent font-bold focus:outline-hidden ${isDark ? "text-slate-200" : "text-slate-700"}`}
                          value={activeElement.fontSize}
                          onChange={(e) => handleUpdateActiveElement({ fontSize: parseInt(e.target.value) || 12 })}
                        />
                        <button
                          className={`px-2.5 font-bold h-full border-l cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300 border-slate-800 active:bg-slate-700" : "hover:bg-slate-100 text-slate-600 border-slate-200 active:bg-slate-200"}`}
                          onClick={() => handleUpdateActiveElement({ fontSize: Math.min(150, activeElement.fontSize + 2) })}
                        >
                          +
                        </button>
                      </div>

                      {/* Bold button */}
                      <button
                        onClick={() => handleUpdateActiveElement({ fontWeight: activeElement.fontWeight === "bold" ? "normal" : "bold" })}
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                          activeElement.fontWeight === "bold"
                            ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-600/10"
                            : isDark
                            ? "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                        title="Negrita"
                      >
                        <Bold className="size-4" />
                      </button>

                      {/* Alignment toggles */}
                      <div className={`flex border rounded-lg overflow-hidden h-8 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                        {(["left", "center", "right"] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => handleUpdateActiveElement({ align })}
                            className={`px-2.5 h-full flex items-center justify-center border-r last:border-r-0 cursor-pointer transition-colors ${
                              isDark
                                ? `hover:bg-slate-800 border-slate-800 ${activeElement.align === align ? "bg-indigo-500/20 text-indigo-400 font-bold" : "text-slate-500"}`
                                : `hover:bg-slate-100 border-slate-200 ${activeElement.align === align ? "bg-indigo-50/80 text-indigo-600 font-bold" : "text-slate-400"}`
                            }`}
                            title={`Alinear a la ${align === "left" ? "izquierda" : align === "center" ? "centro" : "derecha"}`}
                          >
                            {align === "left" ? <AlignLeft className="size-3.5" /> : align === "center" ? <AlignCenter className="size-3.5" /> : <AlignRight className="size-3.5" />}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* QR Size control */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Tamaño QR:</span>
                        <div className={`flex items-center border rounded-lg overflow-hidden h-8 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-250 bg-white"}`}>
                          <button
                            className={`px-2.5 font-bold h-full border-r cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300 border-slate-800 active:bg-slate-700" : "hover:bg-slate-100 text-slate-600 border-slate-200 active:bg-slate-200"}`}
                            onClick={() => handleUpdateActiveElement({ qrSize: Math.max(50, (activeElement.qrSize || 120) - 10) })}
                          >
                            -
                          </button>
                          <span className={`w-12 text-center text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{activeElement.qrSize || 120}px</span>
                          <button
                            className={`px-2.5 font-bold h-full border-l cursor-pointer transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300 border-slate-800 active:bg-slate-700" : "hover:bg-slate-100 text-slate-600 border-slate-200 active:bg-slate-200"}`}
                            onClick={() => handleUpdateActiveElement({ qrSize: Math.min(300, (activeElement.qrSize || 120) + 10) })}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Color picker */}
                  <div className={`flex items-center gap-2 pl-3 border-l ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                    <div className="relative flex items-center h-8">
                      <input
                        type="color"
                        className="size-6 p-0 border border-slate-705 cursor-pointer rounded-md overflow-hidden bg-transparent shrink-0"
                        value={activeElement.color}
                        onChange={(e) => handleUpdateActiveElement({ color: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {COLOR_PRESETS.slice(0, 4).map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="size-4.5 rounded-full border border-white/10 shadow-xs cursor-pointer hover:scale-110 active:scale-90 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleUpdateActiveElement({ color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right group: Width adjustment & coordinates fine-tuning */}
                <div className="flex items-center gap-4">
                  {activeElement.id !== "qr" && (
                    <div className={`flex items-center gap-2 border-l pl-4 ${isDark ? "border-slate-800/85" : "border-slate-200"}`}>
                      <button
                        onClick={() => handleUpdateActiveElement({ autoWidth: !(activeElement.autoWidth ?? true) })}
                        className={`text-[10px] font-bold uppercase h-8 px-2.5 rounded-lg border cursor-pointer transition-all ${
                          !(activeElement.autoWidth ?? true)
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10"
                            : isDark
                            ? "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {(activeElement.autoWidth ?? true) ? "Ancho Automático" : "Ancho Manual"}
                      </button>
                      {!(activeElement.autoWidth ?? true) && (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={activeElement.maxWidth || 80}
                            onChange={(e) => handleUpdateActiveElement({ maxWidth: parseFloat(e.target.value) })}
                            className="w-18 accent-indigo-500 cursor-pointer"
                          />
                          <span className={`text-[10px] font-mono w-7 text-right ${isDark ? "text-slate-400" : "text-slate-505"}`}>{activeElement.maxWidth || 80}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* X & Y position fine-tuning */}
                  <div className={`flex items-center gap-2.5 border-l pl-4 ${isDark ? "border-slate-800/85" : "border-slate-200"}`}>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-mono font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>X:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={activeElement.x}
                        onChange={(e) => handleUpdateActiveElement({ x: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                        className={`w-11 h-8 text-center text-xs border rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold ${isDark ? "border-slate-800 bg-slate-900 text-slate-200" : "border-slate-250 bg-white text-slate-800"}`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-mono font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>Y:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={activeElement.y}
                        onChange={(e) => handleUpdateActiveElement({ y: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                        className={`w-11 h-8 text-center text-xs border rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold ${isDark ? "border-slate-800 bg-slate-900 text-slate-200" : "border-slate-250 bg-white text-slate-800"}`}
                      />
                    </div>
                  </div>

                  {/* Trash element */}
                  <button
                    onClick={() => {
                      if (schema.elements.length <= 1) {
                        toast.error("Debe haber al menos un elemento en el certificado.")
                        return
                      }
                      const filtered = schema.elements.filter((el) => el.id !== activeElementId)
                      setSchema(prev => ({ ...prev, elements: filtered }))
                      setActiveElementId(filtered[0].id)
                      toast.success("Elemento eliminado de la plantilla.")
                    }}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${isDark ? "border-slate-800 bg-slate-900 hover:bg-red-950/30 hover:border-red-900 text-red-400 hover:text-red-350" : "border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-red-500 hover:text-red-600"}`}
                    title="Eliminar elemento"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

              </div>
            ) : (
              <div className={`text-xs italic flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Sparkles className="size-3.5 text-indigo-400" />
                Haz clic en cualquier texto del certificado para ajustar su tipografía, tamaño y color.
              </div>
            )}
          </div>

          {/* Central canvas presentation layer */}
          <div className={`flex-1 p-8 flex flex-col items-center justify-center overflow-auto relative ${isDark ? "bg-[#1e293b]/20" : "bg-slate-300/20"}`}>
            <div className={`absolute top-4 left-4 backdrop-blur-xs border rounded-lg px-3 py-1.5 text-[10px] flex items-center gap-1.5 pointer-events-none shadow-md ${isDark ? "bg-slate-900/60 border-slate-800/80 text-slate-400" : "bg-white/80 border-slate-200/80 text-slate-600"}`}>
              <Sparkles className="size-3.5 text-indigo-400 animate-pulse" />
              Arrastra los textos sobre la hoja para recolocarlos visualmente
            </div>

            {/* Simulated A4/A5 Document Sheet */}
            <div
              ref={canvasRef}
              className={`w-full max-w-3xl aspect-[1.414] bg-white border shadow-2xl relative overflow-hidden select-none flex items-center justify-center transition-all duration-300 rounded-lg ${isDark ? "border-slate-800/70" : "border-slate-300/70"}`}
              style={{
                backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            >
              {!bgUrl && (
                <div className={`text-center p-8 space-y-3 backdrop-blur-xs border rounded-2xl max-w-sm ${isDark ? "bg-[#111827]/40 border-slate-800/60" : "bg-slate-50/80 border-slate-200"}`}>
                  <Award className="size-16 mx-auto text-indigo-400/30 animate-pulse" />
                  <p className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Diseño de Certificado</p>
                  <p className={`text-xs leading-normal ${isDark ? "text-slate-500" : "text-slate-600"}`}>Configura las dimensiones e importa una imagen de fondo en la pestaña **Lienzo** para comenzar.</p>
                </div>
              )}

              {bgUrl &&
                schema.elements.map((el) => {
                  if (el.id === "qr" && !el.showQr) return null
                  const isActive = el.id === activeElementId

                  return (
                    <div
                      key={el.id}
                      data-element-id={el.id}
                      onMouseDown={(e) => handleDragStart(e, el.id)}
                      className={`absolute p-2 rounded group transition-all duration-150 ${
                        el.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                      } ${isActive
                        ? el.locked
                          ? "border-2 border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/5"
                          : "border-2 border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/5"
                        : "hover:border hover:border-slate-400 hover:bg-white/10"
                      }`}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        transform: getTransform(el.align),
                        width: (el.autoWidth ?? true) ? "auto" : `${el.maxWidth || 80}%`,
                        textAlign: el.align,
                        wordBreak: (el.autoWidth ?? true) ? "normal" : "break-word",
                        whiteSpace: (el.autoWidth ?? true) ? "nowrap" : "normal"
                      }}
                    >
                      {/* Selection handles (corners and sides) */}
                      {isActive && (
                        <>
                          {/* Corner handles */}
                          <div
                            onMouseDown={(e) => handleResizeFontSizeStart(e, el.id)}
                            className={`absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900 z-30 shadow-md animate-in fade-in duration-200 ${
                              el.locked ? "cursor-default" : "cursor-nwse-resize"
                            }`}
                          />
                          <div
                            onMouseDown={(e) => handleResizeFontSizeStart(e, el.id)}
                            className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900 z-30 shadow-md animate-in fade-in duration-200 ${
                              el.locked ? "cursor-default" : "cursor-nesw-resize"
                            }`}
                          />
                          <div
                            onMouseDown={(e) => handleResizeFontSizeStart(e, el.id)}
                            className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900 z-30 shadow-md animate-in fade-in duration-200 ${
                              el.locked ? "cursor-default" : "cursor-nesw-resize"
                            }`}
                          />
                          <div
                            onMouseDown={(e) => handleResizeFontSizeStart(e, el.id)}
                            className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-indigo-500 bg-indigo-650 z-30 shadow-md animate-in fade-in duration-200 ${
                              el.locked ? "cursor-default" : "cursor-nwse-resize"
                            }`}
                          />

                          {/* Side handles */}
                          <div
                            onMouseDown={(e) => handleResizeWidthStart(e, el.id)}
                            className={`absolute top-1/2 -translate-y-1/2 -left-1 w-1.5 h-3 rounded-full border border-indigo-550 bg-white dark:bg-slate-900 z-30 shadow-md animate-in fade-in duration-200 ${
                              el.locked ? "cursor-default" : "cursor-ew-resize"
                            }`}
                          />
                          <div
                            onMouseDown={(e) => handleResizeWidthStart(e, el.id)}
                            className={`absolute top-1/2 -translate-y-1/2 -right-1 w-1.5 h-3 rounded-full border border-indigo-550 bg-white dark:bg-slate-900 z-30 shadow-md animate-in fade-in duration-200 ${
                              el.locked ? "cursor-default" : "cursor-ew-resize"
                            }`}
                          />
                        </>
                      )}

                      {/* Floating Action Toolbar */}
                      {isActive && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-lg shadow-xl px-1.5 py-1 z-35 gap-1.5 animate-in fade-in zoom-in-95 duration-150 text-slate-700 dark:text-slate-250 shrink-0"
                        >
                          {el.id !== "qr" && (
                            <button
                              onClick={() => setEditingElementId(el.id)}
                              className="p-1.5 rounded-md hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
                              title="Editar texto"
                            >
                              <Edit className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleLockElement(el.id)}
                            className={`p-1.5 rounded-md hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                              el.locked ? "text-amber-500 hover:text-amber-600" : "text-slate-500 hover:text-amber-505"
                            }`}
                            title={el.locked ? "Desbloquear posición" : "Bloquear posición"}
                          >
                            {el.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDuplicateElement(el.id)}
                            className="p-1.5 rounded-md hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer"
                            title="Duplicar elemento"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-850 self-center" />
                          <button
                            onClick={() => {
                              if (schema.elements.length <= 1) {
                                toast.error("Debe haber al menos un elemento en el certificado.")
                                return
                              }
                              const filtered = schema.elements.filter((item) => item.id !== el.id)
                              setSchema(prev => ({ ...prev, elements: filtered }))
                              setActiveElementId(filtered[0]?.id || "")
                              toast.success("Elemento eliminado")
                            }}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}

                      <div className={`absolute -top-4.5 left-1/2 -translate-x-1/2 ${isActive ? "hidden" : "hidden group-hover:flex"} items-center gap-1 bg-indigo-600 text-[8px] text-white font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none tracking-wider uppercase`}>
                        <Move className="size-2.5" />
                        <span>{el.label}</span>
                      </div>

                      {el.id === "qr" ? (
                        <div
                          style={{
                            width: `${(el.qrSize || 120) * scale}px`
                          }}
                          className="bg-white p-1 rounded-sm shadow-xs"
                        >
                          <QrPreviewSvg size={el.qrSize || 120} color={el.color || "#000000"} seed="VAL-ZYNQRO" />
                        </div>
                      ) : editingElementId === el.id ? (
                        <input
                          type="text"
                          value={el.text}
                          onChange={(e) => handleUpdateActiveElement({ text: e.target.value })}
                          onBlur={() => setEditingElementId(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingElementId(null)
                            }
                          }}
                          autoFocus
                          style={{
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize * scale}px`,
                            color: el.color,
                            fontWeight: el.fontWeight,
                            textAlign: el.align,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            width: "100%",
                            padding: 0,
                            margin: 0,
                            display: "block",
                            boxShadow: "none"
                          }}
                        />
                      ) : (
                        <span
                          onDoubleClick={() => setEditingElementId(el.id)}
                          style={{
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize * scale}px`, // Scaled for screen preview
                            color: el.color,
                            fontWeight: el.fontWeight,
                            textAlign: el.align,
                            display: "block",
                            whiteSpace: (el.autoWidth ?? true) ? "nowrap" : "normal",
                            wordBreak: (el.autoWidth ?? true) ? "normal" : "break-word"
                          }}
                        >
                          {el.text.includes("{{name}}")
                            ? "JUAN GOMEZ PEREZ"
                            : el.text.includes("{{date}}")
                              ? "03/07/2026"
                              : el.text}
                        </span>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Format Selection Dialog */}
      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent className={`sm:max-w-md border ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-slate-100" : "text-slate-900"}>Descargar Certificado de Prueba</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Selecciona el formato en el que deseas descargar la muestra del certificado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className={`flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border hover:border-indigo-500 transition-all duration-300 ${isDark ? "border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600"}`}
              onClick={() => {
                setIsDownloadModalOpen(false)
                handleTestDownload("png")
              }}
            >
              <Award className="size-8 text-indigo-400" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar Imagen</div>
                <div className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-600"}`}>Formato PNG en alta resolución</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className={`flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border hover:border-indigo-500 transition-all duration-300 ${isDark ? "border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600"}`}
              onClick={() => {
                setIsDownloadModalOpen(false)
                handleTestDownload("pdf")
              }}
            >
              <Download className="size-8 text-indigo-400" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar PDF</div>
                <div className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-600"}`}>Documento vectorial listo para imprimir</div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDownloadModalOpen(false)} className={`text-xs cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"}`}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={isCloseConfirmationOpen} onOpenChange={setIsCloseConfirmationOpen}>
        <DialogContent className={`sm:max-w-md border ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-slate-100" : "text-slate-900"}>¿Salir sin guardar cambios?</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Tienes cambios sin guardar en el diseño de tu certificado. Si sales ahora, perderás todos los cambios realizados desde tu último guardado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsCloseConfirmationOpen(false)}
              className={`text-xs cursor-pointer ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"}`}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsCloseConfirmationOpen(false)
                onClose()
              }}
              className="text-xs cursor-pointer bg-red-650 hover:bg-red-750 text-white font-bold"
            >
              Salir sin guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
