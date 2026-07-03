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
  AlignRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"
import { toast } from "sonner"
import QRCode from "qrcode"
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
  const [activeTab, setActiveTab] = useState<"background" | "text" | "layers">("text")

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
    <div className="fixed inset-0 bg-[#0f172a]/95 text-slate-100 z-50 flex flex-col animate-in fade-in duration-300 font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Editor Header */}
      <header className="h-16 border-b border-slate-800 bg-[#1e293b]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-sm text-slate-100">Diseñador de Certificados</h1>
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
            className="text-xs gap-1.5 cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white"
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
            onClick={onClose}
            className="rounded-full size-8 hover:bg-slate-800 text-slate-450 hover:text-slate-200"
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden bg-[#090d16] relative z-10">

        {/* Leftmost Narrow Icon Sidebar */}
        <div className="w-20 bg-[#111827] border-r border-slate-800/80 flex flex-col items-center py-6 gap-6 shrink-0 select-none">
          <button
            onClick={() => setActiveTab("background")}
            className={`flex flex-col items-center gap-2 w-full py-3.5 text-center cursor-pointer transition-all relative ${activeTab === "background"
              ? "text-indigo-450 font-bold bg-[#1f2937]/50"
              : "text-slate-500 hover:text-slate-300"
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
            className={`flex flex-col items-center gap-2 w-full py-3.5 text-center cursor-pointer transition-all relative ${activeTab === "text"
              ? "text-indigo-450 font-bold bg-[#1f2937]/50"
              : "text-slate-500 hover:text-slate-300"
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
            className={`flex flex-col items-center gap-2 w-full py-3.5 text-center cursor-pointer transition-all relative ${activeTab === "layers"
              ? "text-indigo-450 font-bold bg-[#1f2937]/50"
              : "text-slate-500 hover:text-slate-300"
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
        <aside className="w-80 bg-[#1f2937]/65 backdrop-blur-md border-r border-slate-800/80 p-5 flex flex-col gap-6 overflow-y-auto shrink-0 relative">
          {activeTab === "background" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Tamaño del Certificado</h3>
                <p className="text-[10px] text-slate-500 leading-normal">Determina las proporciones físicas para la exportación y visualización.</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => handleFormatChange("a4")}
                    className={`flex flex-col justify-center items-center py-4 rounded-xl border text-center transition-all cursor-pointer ${selectedFormat === "a4"
                      ? "border-indigo-500 bg-indigo-500/15 text-indigo-400 font-bold shadow-md shadow-indigo-500/5"
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <span className="text-xs">A4 Horizontal</span>
                    <span className="text-[8px] opacity-80 mt-0.5">297 x 210 mm (A4)</span>
                  </button>
                  <button
                    onClick={() => handleFormatChange("a5")}
                    className={`flex flex-col justify-center items-center py-4 rounded-xl border text-center transition-all cursor-pointer ${selectedFormat === "a5"
                      ? "border-indigo-500 bg-indigo-500/15 text-indigo-400 font-bold shadow-md shadow-indigo-500/5"
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <span className="text-xs">A5 Horizontal</span>
                    <span className="text-[8px] opacity-80 mt-0.5">210 x 148 mm (A5)</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-6 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Fondo del Certificado</h3>
                <p className="text-[10px] text-slate-500 leading-normal">Carga la plantilla de diseño base sin los textos dinámicos.</p>
                <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                  <ImageUploadWithPreview
                    label="Imagen de Fondo"
                    value={bgUrl}
                    onChange={setBgUrl}
                    aspectRatio="banner"
                    folder="certificates"
                    identifier="bg"
                    placeholder="Sube el archivo base"
                  />
                </div>
                <div className="text-[10px] text-slate-505 bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-3 leading-relaxed">
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
                  className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-600"
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
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Estilos de texto predeterminados</h3>

                <button
                  onClick={() => handleAddTextElement("Agregar un título", 48, "bold")}
                  className="w-full text-left p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-slate-100 cursor-pointer group"
                >
                  <span className="block font-bold text-base leading-none group-hover:text-indigo-400 transition-colors">Agregar un título</span>
                </button>

                <button
                  onClick={() => handleAddTextElement("Agregar un subtítulo", 28, "normal")}
                  className="w-full text-left p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-slate-100 cursor-pointer group"
                >
                  <span className="block font-medium text-xs leading-none group-hover:text-indigo-400 transition-colors">Agregar un subtítulo</span>
                </button>

                <button
                  onClick={() => handleAddTextElement("Agregar algo de texto", 18, "normal")}
                  className="w-full text-left p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-slate-400 hover:text-slate-200 cursor-pointer group"
                >
                  <span className="block text-[10px] leading-none transition-colors">Agregar texto de cuerpo</span>
                </button>
              </div>

              <div className="border-t border-slate-800/60 pt-5 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Campos Dinámicos (Zynqro)</h3>
                <p className="text-[10px] text-slate-500 leading-normal">Variables de autocompletado en certificados reales:</p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleAddTextElement("{{name}}", 48, "bold")}
                    className="flex items-center justify-between text-left p-2.5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors"
                  >
                    <span>Nombre del Participante</span>
                    <span className="font-mono text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md border border-indigo-500/20 font-bold uppercase">NAME</span>
                  </button>

                  <button
                    onClick={() => handleAddTextElement("Emitido el {{date}}", 18, "normal")}
                    className="flex items-center justify-between text-left p-2.5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors"
                  >
                    <span>Fecha de Emisión</span>
                    <span className="font-mono text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20 font-bold uppercase">DATE</span>
                  </button>

                  <button
                    onClick={handleToggleQR}
                    className={`flex items-center justify-between text-left p-2.5 bg-slate-900/40 border rounded-xl text-xs cursor-pointer transition-all ${schema.elements.some(el => el.id === "qr" && el.showQr)
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-450 font-bold"
                      : "border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5 text-slate-300"
                      }`}
                  >
                    <span>{schema.elements.some(el => el.id === "qr" && el.showQr) ? "QR de Validación (Activo)" : "Activar QR de Validación"}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border ${schema.elements.some(el => el.id === "qr" && el.showQr)
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
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Capas de la Plantilla</h3>
              {schema.elements.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No hay capas agregadas en esta plantilla.</p>
              ) : (
                <div className="space-y-2">
                  {schema.elements.map((el) => {
                    const isActive = el.id === activeElementId
                    return (
                      <div
                        key={el.id}
                        onClick={() => setActiveElementId(el.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isActive
                          ? "border-indigo-500 bg-indigo-500/10 font-bold shadow-md"
                          : "border-slate-800 bg-slate-900/30 hover:bg-slate-800/40"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${el.id === "qr"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                            : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                            }`}>
                            {el.id === "qr" ? "QR" : "TXT"}
                          </span>
                          <span className="text-xs text-slate-200 truncate">{el.label}</span>
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
          <div className="h-14 border-b border-slate-800/80 bg-[#111827] px-6 flex items-center justify-between gap-4 select-none shrink-0 shadow-md relative z-10">
            {activeElement ? (
              <div className="flex items-center gap-4 text-xs w-full justify-between animate-in fade-in duration-200">

                {/* Left group: Font, Size, Color, Weight, Align */}
                <div className="flex items-center gap-3">
                  {activeElement.id !== "qr" ? (
                    <>
                      {/* Font Family select */}
                      <select
                        className="rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-200 px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
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
                      <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-900 h-8">
                        <button
                          className="px-2.5 hover:bg-slate-800 text-slate-300 font-bold h-full border-r border-slate-800 cursor-pointer active:bg-slate-700 transition-colors"
                          onClick={() => handleUpdateActiveElement({ fontSize: Math.max(10, activeElement.fontSize - 2) })}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="w-10 text-center text-xs h-full border-0 focus:ring-0 bg-transparent text-slate-200 font-bold focus:outline-hidden"
                          value={activeElement.fontSize}
                          onChange={(e) => handleUpdateActiveElement({ fontSize: parseInt(e.target.value) || 12 })}
                        />
                        <button
                          className="px-2.5 hover:bg-slate-800 text-slate-300 font-bold h-full border-l border-slate-800 cursor-pointer active:bg-slate-700 transition-colors"
                          onClick={() => handleUpdateActiveElement({ fontSize: Math.min(150, activeElement.fontSize + 2) })}
                        >
                          +
                        </button>
                      </div>

                      {/* Bold button */}
                      <button
                        onClick={() => handleUpdateActiveElement({ fontWeight: activeElement.fontWeight === "bold" ? "normal" : "bold" })}
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${activeElement.fontWeight === "bold"
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-600/10"
                          : "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                          }`}
                        title="Negrita"
                      >
                        <Bold className="size-4" />
                      </button>

                      {/* Alignment toggles */}
                      <div className="flex border border-slate-800 rounded-lg overflow-hidden bg-slate-900 h-8">
                        {(["left", "center", "right"] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => handleUpdateActiveElement({ align })}
                            className={`px-2.5 h-full hover:bg-slate-800 flex items-center justify-center border-r last:border-r-0 border-slate-800 cursor-pointer transition-colors ${activeElement.align === align ? "bg-indigo-550/20 text-indigo-400 font-bold" : "text-slate-500"
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
                        <span className="text-[10px] font-bold text-slate-505 uppercase tracking-wide">Tamaño QR:</span>
                        <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-900 h-8">
                          <button
                            className="px-2.5 hover:bg-slate-800 text-slate-300 font-bold h-full border-r border-slate-800 cursor-pointer active:bg-slate-700 transition-colors"
                            onClick={() => handleUpdateActiveElement({ qrSize: Math.max(50, (activeElement.qrSize || 120) - 10) })}
                          >
                            -
                          </button>
                          <span className="w-12 text-center text-xs font-bold text-slate-200">{activeElement.qrSize || 120}px</span>
                          <button
                            className="px-2.5 hover:bg-slate-800 text-slate-300 font-bold h-full border-l border-slate-800 cursor-pointer active:bg-slate-700 transition-colors"
                            onClick={() => handleUpdateActiveElement({ qrSize: Math.min(300, (activeElement.qrSize || 120) + 10) })}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Color picker */}
                  <div className="flex items-center gap-2 pl-3 border-l border-slate-800/80">
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
                    <div className="flex items-center gap-2 border-l border-slate-800/85 pl-4">
                      <button
                        onClick={() => handleUpdateActiveElement({ autoWidth: !(activeElement.autoWidth ?? true) })}
                        className={`text-[10px] font-bold uppercase h-8 px-2.5 rounded-lg border cursor-pointer transition-all ${!(activeElement.autoWidth ?? true)
                          ? "bg-indigo-655 text-white border-indigo-650 shadow-md shadow-indigo-600/10"
                          : "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
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
                          <span className="text-[10px] font-mono text-slate-400 w-7 text-right">{activeElement.maxWidth || 80}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* X & Y position fine-tuning */}
                  <div className="flex items-center gap-2.5 border-l border-slate-800/85 pl-4">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">X:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={activeElement.x}
                        onChange={(e) => handleUpdateActiveElement({ x: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                        className="w-11 h-8 text-center text-xs border border-slate-800 bg-slate-900 text-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Y:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={activeElement.y}
                        onChange={(e) => handleUpdateActiveElement({ y: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                        className="w-11 h-8 text-center text-xs border border-slate-800 bg-slate-900 text-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-semibold"
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
                    className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 hover:bg-red-950/30 hover:border-red-900 text-red-400 hover:text-red-350 flex items-center justify-center cursor-pointer transition-colors"
                    title="Eliminar elemento"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-xs text-slate-400 italic flex items-center gap-2">
                <Sparkles className="size-3.5 text-indigo-400" />
                Haz clic en cualquier texto del certificado para ajustar su tipografía, tamaño y color.
              </div>
            )}
          </div>

          {/* Central canvas presentation layer */}
          <div className="flex-1 bg-[#1e293b]/20 p-8 flex flex-col items-center justify-center overflow-auto relative">
            <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-xs border border-slate-800/80 rounded-lg px-3 py-1.5 text-[10px] text-slate-405 flex items-center gap-1.5 pointer-events-none shadow-md">
              <Sparkles className="size-3.5 text-indigo-400 animate-pulse" />
              Arrastra los textos sobre la hoja para recolocarlos visualmente
            </div>

            {/* Simulated A4/A5 Document Sheet */}
            <div
              ref={canvasRef}
              className="w-full max-w-3xl aspect-[1.414] bg-white border border-slate-800/70 shadow-2xl relative overflow-hidden select-none flex items-center justify-center transition-all duration-300 rounded-lg"
              style={{
                backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            >
              {!bgUrl && (
                <div className="text-center p-8 space-y-3 bg-[#111827]/40 backdrop-blur-xs border border-slate-800/60 rounded-2xl max-w-sm">
                  <Award className="size-16 mx-auto text-indigo-400/30 animate-pulse" />
                  <p className="text-slate-300 text-sm font-semibold">Diseño de Certificado</p>
                  <p className="text-xs text-slate-500 leading-normal">Configura las dimensiones e importa una imagen de fondo en la pestaña **Lienzo** para comenzar.</p>
                </div>
              )}

              {bgUrl &&
                schema.elements.map((el) => {
                  if (el.id === "qr" && !el.showQr) return null
                  const isActive = el.id === activeElementId

                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleDragStart(e, el.id)}
                      className={`absolute p-2 rounded cursor-grab active:cursor-grabbing group transition-all duration-150 ${isActive
                        ? "border-2 border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/5"
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
                      <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-indigo-600 text-[8px] text-white font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none tracking-wider uppercase">
                        <Move className="size-2.5" />
                        <span>{el.label}</span>
                      </div>

                      {el.id === "qr" ? (
                        <div
                          style={{
                            width: `${(el.qrSize || 120) * 0.5}px`
                          }}
                          className="bg-white p-1 rounded-sm shadow-xs"
                        >
                          <QrPreviewSvg size={el.qrSize || 120} color={el.color || "#000000"} seed="VAL-ZYNQRO" />
                        </div>
                      ) : (
                        <span
                          style={{
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize * 0.5}px`, // Scaled for screen preview
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
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Descargar Certificado de Prueba</DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecciona el formato en el que deseas descargar la muestra del certificado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border-slate-800 hover:border-indigo-500 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white transition-all duration-300"
              onClick={() => {
                setIsDownloadModalOpen(false)
                handleTestDownload("png")
              }}
            >
              <Award className="size-8 text-indigo-400" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar Imagen</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Formato PNG en alta resolución</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border-slate-800 hover:border-indigo-500 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white transition-all duration-300"
              onClick={() => {
                setIsDownloadModalOpen(false)
                handleTestDownload("pdf")
              }}
            >
              <Download className="size-8 text-indigo-400" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar PDF</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Documento vectorial listo para imprimir</div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDownloadModalOpen(false)} className="text-xs cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-slate-200">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
