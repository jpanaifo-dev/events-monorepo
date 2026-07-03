import React, { useState, useEffect, useRef } from "react"
import { Award, Save, X, Move, Download, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"
import { toast } from "sonner"
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
}

interface DesignSchema {
  width: number
  height: number
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
  width: 1920,
  height: 1080,
  elements: [
    {
      id: "title",
      label: "Título del Certificado",
      text: "Certificado de Participación",
      x: 50,
      y: 25,
      fontSize: 50,
      fontFamily: "Outfit",
      color: "#1e1b4b",
      align: "center",
      fontWeight: "bold",
      maxWidth: 80
    },
    {
      id: "recipient",
      label: "Nombre del Participante",
      text: "{{name}}",
      x: 50,
      y: 45,
      fontSize: 56,
      fontFamily: "Playfair Display",
      color: "#4338ca",
      align: "center",
      fontWeight: "bold",
      maxWidth: 85
    },
    {
      id: "description",
      label: "Descripción / Detalle",
      text: "Por completar exitosamente la edición anual de nuestro congreso de tecnología.",
      x: 50,
      y: 60,
      fontSize: 24,
      fontFamily: "Inter",
      color: "#4b5563",
      align: "center",
      fontWeight: "normal",
      maxWidth: 75
    },
    {
      id: "date",
      label: "Fecha / Ciudad",
      text: "Emitido el {{date}}",
      x: 50,
      y: 75,
      fontSize: 18,
      fontFamily: "Inter",
      color: "#6b7280",
      align: "center",
      fontWeight: "normal",
      maxWidth: 80
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

export function QrPreviewSvg({ size, color, seed: code }: QrPreviewSvgProps) {
  const gridCount = 21
  const moduleSize = size / gridCount

  // Draw timing/finder patterns and modules
  const finderPatterns = [
    { r: 0, c: 0 },
    { r: 0, c: 14 },
    { r: 14, c: 0 },
  ]

  // Helper to check if a module is part of a finder pattern
  const getFinderColor = (r: number, c: number): string | null => {
    for (const f of finderPatterns) {
      if (r >= f.r && r < f.r + 7 && c >= f.c && c < f.c + 7) {
        const localR = r - f.r
        const localC = c - f.c
        const isOuterBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6
        const isInnerSquare = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4
        return (isOuterBorder || isInnerSquare) ? color : "#ffffff"
      }
    }
    return null
  }

  // Deterministic random generator
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i)
    hash |= 0
  }
  let currentSeed = Math.abs(hash) || 12345
  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }

  const rects: React.ReactNode[] = []

  for (let r = 0; r < gridCount; r++) {
    for (let c = 0; c < gridCount; c++) {
      const finderColor = getFinderColor(r, c)
      let moduleColor = "#ffffff"

      if (finderColor !== null) {
        moduleColor = finderColor
      } else if (r === 6 || c === 6) {
        // Timing pattern
        moduleColor = ((r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0)) ? color : "#ffffff"
      } else {
        // Random modules
        moduleColor = pseudoRandom() > 0.45 ? color : "#ffffff"
      }

      if (moduleColor !== "#ffffff") {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * moduleSize}
            y={r * moduleSize}
            width={moduleSize}
            height={moduleSize}
            fill={color}
          />
        )
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", backgroundColor: "#ffffff" }}
    >
      {rects}
    </svg>
  )
}

export function drawProfessionalQR(
  ctx: CanvasRenderingContext2D,
  xPx: number,
  yPx: number,
  qrSize: number,
  color: string,
  code: string
) {
  // Center is at (xPx, yPx). Calculate top-left of the QR box:
  const qrX = xPx - qrSize / 2
  const qrY = yPx - qrSize / 2

  // Draw background white box
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(qrX, qrY, qrSize, qrSize)

  // QR grid dimensions: 21x21 (Version 1 QR code)
  const gridCount = 21
  const moduleSize = qrSize / gridCount

  // Helper to draw a square module
  const drawModule = (r: number, c: number, fillStyle: string) => {
    ctx.fillStyle = fillStyle
    ctx.fillRect(
      Math.round(qrX + c * moduleSize),
      Math.round(qrY + r * moduleSize),
      Math.ceil(moduleSize),
      Math.ceil(moduleSize)
    )
  }

  // Draw standard QR finder patterns
  const drawFinderPattern = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const globalRow = startRow + r
        const globalCol = startCol + c
        const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isInnerSquare = r >= 2 && r <= 4 && c >= 2 && c <= 4
        
        if (isOuterBorder) {
          drawModule(globalRow, globalCol, color)
        } else if (isInnerSquare) {
          drawModule(globalRow, globalCol, color)
        } else {
          drawModule(globalRow, globalCol, "#ffffff")
        }
      }
    }
  }

  drawFinderPattern(0, 0)         // Top-left
  drawFinderPattern(0, 14)        // Top-right
  drawFinderPattern(14, 0)        // Bottom-left

  // Generate deterministic QR data modules based on the code hash
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i)
    hash |= 0 // 32bit int
  }
  let seed = Math.abs(hash) || 12345
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  // Draw the remaining cells of the 21x21 grid
  for (let r = 0; r < gridCount; r++) {
    for (let c = 0; c < gridCount; c++) {
      // Skip finder pattern areas
      const isTopLeftFinder = r < 8 && c < 8
      const isTopRightFinder = r < 8 && c >= 13
      const isBottomLeftFinder = r >= 13 && c < 8
      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
        continue
      }

      // Draw timing patterns (row 6 and col 6) as alternating black/white modules
      if (r === 6 || c === 6) {
        if ((r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0)) {
          drawModule(r, c, color)
        } else {
          drawModule(r, c, "#ffffff")
        }
        continue
      }

      // Fill in remaining modules deterministically
      if (pseudoRandom() > 0.45) {
        drawModule(r, c, color)
      } else {
        drawModule(r, c, "#ffffff")
      }
    }
  }

  // Draw validation code underneath the QR code
  ctx.font = `12px monospace`
  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.fillText(code, xPx, yPx + qrSize / 2 + 18)
}

export function CertificateDesignEditor({
  templateName,
  backgroundImageUrl: initialBgUrl,
  designSchema: initialSchema,
  onSave,
  onClose
}: CertificateDesignEditorProps) {
  const [bgUrl, setBgUrl] = useState(initialBgUrl || "")
  const [schema, setSchema] = useState<DesignSchema>(() => {
    if (initialSchema && Array.isArray(initialSchema.elements)) {
      return initialSchema as DesignSchema
    }
    return DEFAULT_SCHEMA
  })
  const [activeElementId, setActiveElementId] = useState<string>("recipient")
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

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

  const activeElement = schema.elements.find((el) => el.id === activeElementId) || schema.elements[0]

  const handleUpdateActiveElement = (updates: Partial<TextElement>) => {
    setSchema((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === activeElementId ? { ...el, ...updates } : el))
    }))
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
      toast.success("Diseño del certificado guardado correctamente.")
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error("Error al guardar el diseño.")
    } finally {
      setIsSaving(false)
    }
  }

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
          drawProfessionalQR(ctx, xPx, yPx, qrSize, el.color || "#000000", "test-validation-code")
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
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [schema.width, schema.height]
        })
        const imgData = canvas.toDataURL("image/png")
        doc.addImage(imgData, "PNG", 0, 0, schema.width, schema.height)
        doc.save(`CERT-PRUEBA-${templateName.replace(/\s+/g, "_").toUpperCase()}.pdf`)
        toast.success("Muestra de certificado descargada como PDF.", { id: "rendering-cert" })
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
      }))
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col animate-in fade-in duration-300">
      {/* Editor Header */}
      <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
            <Award className="size-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground">Editor de Diseño Visual</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
              {templateName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsDownloadModalOpen(true)} className="text-xs gap-1.5 cursor-pointer">
            <Download className="size-4" />
            Descargar Prueba
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs gap-1.5 cursor-pointer">
            <Save className="size-4" />
            {isSaving ? "Guardando..." : "Guardar Diseño"}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full size-8">
            <X className="size-4" />
          </Button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visual Canvas Area */}
        <div className="flex-1 bg-muted/20 p-8 flex flex-col items-center justify-center overflow-auto relative">
          <div className="absolute top-4 left-4 bg-card/80 backdrop-blur-xs border border-border/60 rounded-lg px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 pointer-events-none shadow-xs">
            <Sparkles className="size-3.5 text-indigo-500" />
            Arrastra los textos sobre el certificado para cambiar su ubicación
          </div>

          <div
            ref={canvasRef}
            className="w-full max-w-4xl aspect-video rounded-xl bg-card border border-border shadow-2xl relative overflow-hidden select-none select-none flex items-center justify-center"
            style={{
              backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat"
            }}
          >
            {!bgUrl && (
              <div className="text-center p-8 space-y-2">
                <Award className="size-16 mx-auto text-muted-foreground/30 animate-pulse" />
                <p className="text-muted-foreground text-sm font-medium">Sube una imagen de fondo en el panel derecho para comenzar.</p>
              </div>
            )}

            {bgUrl &&
              schema.elements.map((el) => {
                if (el.id === "qr" && !el.showQr) return null
                const isActive = el.id === activeElementId

                // Render QR or Text
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleDragStart(e, el.id)}
                    className={`absolute p-2 rounded cursor-grab active:cursor-grabbing group transition-all ${
                      isActive ? "border-2 border-primary bg-primary/5 ring-4 ring-primary/10" : "hover:border border-border/80 hover:bg-card/40"
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
                    {/* Drag Handle */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-0.5 bg-primary text-[9px] text-primary-foreground font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none">
                      <Move className="size-2.5" />
                      <span>{el.label}</span>
                    </div>

                    {el.id === "qr" ? (
                      <div
                        style={{
                          width: `${(el.qrSize || 120) * 0.5}px`,
                          height: `${(el.qrSize || 120) * 0.5}px`
                        }}
                      >
                        <QrPreviewSvg size={el.qrSize || 120} color={el.color || "#000000"} seed="preview-seed-code" />
                      </div>
                    ) : (
                      <span
                        style={{
                          fontFamily: el.fontFamily,
                          fontSize: `${el.fontSize * 0.5}px`, // Proportional scale for preview
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

        {/* Sidebar Controls Area */}
        <aside className="w-80 border-l border-border bg-card p-6 flex flex-col gap-6 overflow-y-auto flex-shrink-0">
          {/* Upload Background */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Fondo del Certificado</h3>
            <ImageUploadWithPreview
              label="Imagen de Fondo (Aspecto 16:9)"
              value={bgUrl}
              onChange={setBgUrl}
              aspectRatio="banner"
              folder="certificates"
              identifier="bg"
              placeholder="Sube la plantilla de fondo (PNG/JPG)"
            />
          </div>

          <hr className="border-border/60" />

          {/* Element Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Elementos de Texto</h3>
              <Button
                variant="outline"
                size="xs"
                className="text-[10px] h-6 px-2 cursor-pointer border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => {
                  const newId = `custom_${Date.now()}`
                  const newElement: TextElement = {
                    id: newId,
                    label: `Texto ${schema.elements.filter(e => e.id.startsWith("custom")).length + 1}`,
                    text: "Texto Personalizado",
                    x: 50,
                    y: 50,
                    fontSize: 24,
                    fontFamily: "Poppins",
                    color: "#1e293b",
                    align: "center",
                    fontWeight: "normal",
                    maxWidth: 80
                  }
                  setSchema((prev) => ({
                    ...prev,
                    elements: [...prev.elements, newElement]
                  }))
                  setActiveElementId(newId)
                  toast.success("Elemento de texto personalizado añadido.")
                }}
              >
                + Añadir Texto
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {schema.elements.map((el) => (
                <Button
                  key={el.id}
                  variant={el.id === activeElementId ? "default" : "outline"}
                  className="justify-start text-xs font-semibold px-2 py-1.5 h-8 truncate cursor-pointer"
                  onClick={() => setActiveElementId(el.id)}
                >
                  <Award className="size-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{el.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Properties Panel */}
          {activeElement && (
            <div className="space-y-4 border border-border/60 p-4 rounded-xl bg-muted/10">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs font-bold text-foreground">{activeElement.label}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:bg-destructive/10 cursor-pointer h-7 w-7"
                    title="Eliminar elemento de la plantilla"
                    onClick={() => {
                      if (schema.elements.length <= 1) {
                        toast.error("Debe haber al menos un elemento en el certificado.")
                        return
                      }
                      const filtered = schema.elements.filter((el) => el.id !== activeElementId)
                      setSchema((prev) => ({ ...prev, elements: filtered }))
                      setActiveElementId(filtered[0].id)
                      toast.success("Elemento eliminado de la plantilla.")
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>

                  {activeElement.id === "qr" && (
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="toggleQr" className="text-[10px] font-semibold text-muted-foreground uppercase cursor-pointer">Activo</Label>
                      <input
                        id="toggleQr"
                        type="checkbox"
                        className="size-3.5 rounded accent-primary"
                        checked={activeElement.showQr ?? true}
                        onChange={(e) => handleUpdateActiveElement({ showQr: e.target.checked })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Text Input (Skip for QR) */}
              {activeElement.id !== "qr" && (
                <div className="space-y-1.5">
                  <Label htmlFor="elText" className="text-xs font-semibold text-muted-foreground">Texto de Muestra / Plantilla</Label>
                  <Input
                    id="elText"
                    value={activeElement.text}
                    onChange={(e) => handleUpdateActiveElement({ text: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Escribe texto..."
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    {activeElement.id === "recipient" && "Usa {{name}} para el nombre."}
                    {activeElement.id === "date" && "Usa {{date}} para la fecha de emisión."}
                  </p>
                </div>
              )}

              {/* Position coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Posición X (%)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeElement.x}
                      onChange={(e) => handleUpdateActiveElement({ x: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <span className="text-xs font-semibold w-8 text-right">{activeElement.x}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Posición Y (%)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeElement.y}
                      onChange={(e) => handleUpdateActiveElement({ y: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <span className="text-xs font-semibold w-8 text-right">{activeElement.y}%</span>
                  </div>
                </div>
              </div>

              {/* Type of Width */}
              {activeElement.id !== "qr" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Ajuste de Ancho</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant={(activeElement.autoWidth ?? true) ? "default" : "outline"}
                      className="h-7 text-[10px] font-bold uppercase cursor-pointer"
                      onClick={() => handleUpdateActiveElement({ autoWidth: true })}
                    >
                      Automático
                    </Button>
                    <Button
                      type="button"
                      variant={!(activeElement.autoWidth ?? true) ? "default" : "outline"}
                      className="h-7 text-[10px] font-bold uppercase cursor-pointer"
                      onClick={() => handleUpdateActiveElement({ autoWidth: false, maxWidth: activeElement.maxWidth || 80 })}
                    >
                      Ancho Manual
                    </Button>
                  </div>
                </div>
              )}

              {/* Max Width coordinates */}
              {activeElement.id !== "qr" && !(activeElement.autoWidth ?? true) && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Ancho Máximo (%)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={activeElement.maxWidth || 80}
                      onChange={(e) => handleUpdateActiveElement({ maxWidth: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <span className="text-xs font-semibold w-8 text-right">{activeElement.maxWidth || 80}%</span>
                  </div>
                </div>
              )}

              {/* Fonts (Skip for QR) */}
              {activeElement.id !== "qr" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Tipografía</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={activeElement.fontFamily}
                      onChange={(e) => handleUpdateActiveElement({ fontFamily: e.target.value })}
                    >
                      {FONT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Tamaño de Letra (px)</Label>
                      <Input
                        type="number"
                        min="10"
                        max="120"
                        value={activeElement.fontSize}
                        onChange={(e) => handleUpdateActiveElement({ fontSize: parseInt(e.target.value) || 12 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Estilo / Peso</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                        value={activeElement.fontWeight}
                        onChange={(e) => handleUpdateActiveElement({ fontWeight: e.target.value as "normal" | "bold" })}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Negrita</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Alineación</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["left", "center", "right"] as const).map((align) => (
                        <Button
                          key={align}
                          type="button"
                          variant={activeElement.align === align ? "default" : "outline"}
                          className="h-7 text-[10px] font-bold uppercase cursor-pointer"
                          onClick={() => handleUpdateActiveElement({ align })}
                        >
                          {align === "left" ? "Izquierda" : align === "center" ? "Centro" : "Derecha"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* QR Size for QR element */}
              {activeElement.id === "qr" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Tamaño del Código QR (px)</Label>
                  <Input
                    type="number"
                    min="50"
                    max="300"
                    value={activeElement.qrSize || 120}
                    onChange={(e) => handleUpdateActiveElement({ qrSize: parseInt(e.target.value) || 100 })}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {/* Color Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Color del Texto / Código</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={activeElement.color}
                    onChange={(e) => handleUpdateActiveElement({ color: e.target.value })}
                    className="size-8 p-0 border border-border/80 cursor-pointer shrink-0"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="size-5 rounded-full border border-white/20 shadow-xs cursor-pointer active:scale-95 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => handleUpdateActiveElement({ color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Format Selection Dialog */}
      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar Certificado de Prueba</DialogTitle>
            <DialogDescription>
              Selecciona el formato en el que deseas descargar la muestra del certificado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border-border hover:border-primary hover:bg-primary/5 transition-all duration-300"
              onClick={() => {
                setIsDownloadModalOpen(false)
                handleTestDownload("png")
              }}
            >
              <Award className="size-8 text-primary" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar Imagen</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Formato PNG en alta resolución</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border-border hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-300"
              onClick={() => {
                setIsDownloadModalOpen(false)
                handleTestDownload("pdf")
              }}
            >
              <Download className="size-8 text-indigo-550" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar PDF</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Documento vectorial listo para imprimir</div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDownloadModalOpen(false)} className="text-xs cursor-pointer">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
