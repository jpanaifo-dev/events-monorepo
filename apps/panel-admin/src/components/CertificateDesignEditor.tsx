import React, { useState, useEffect, useRef } from "react"
import { Award, Save, X, Move, Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"
import { toast } from "sonner"

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
      fontWeight: "bold"
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
      fontWeight: "bold"
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
      fontWeight: "normal"
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
      fontWeight: "normal"
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

  // Dynamically load Google Fonts for the preview
  useEffect(() => {
    const link = document.createElement("link")
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700&family=Outfit:wght@400;700&family=Playfair+Display:ital,wght@0,600;0,800;1,600&display=swap"
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
  const handleTestDownload = () => {
    if (!bgUrl) {
      toast.error("Sube un fondo primero para poder descargar una prueba.")
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = bgUrl
    toast.loading("Renderizando vista previa para descarga...", { id: "rendering-cert" })

    img.onload = () => {
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
          // Draw a mockup QR Box
          ctx.fillStyle = "#ffffff"
          ctx.strokeStyle = el.color || "#000000"
          ctx.lineWidth = 4
          const qrX = xPx - qrSize / 2
          const qrY = yPx - qrSize / 2
          ctx.fillRect(qrX, qrY, qrSize, qrSize)
          ctx.strokeRect(qrX, qrY, qrSize, qrSize)

          // Inner QR boxes to look like QR
          ctx.fillStyle = el.color || "#000000"
          const innerSize = qrSize * 0.25
          ctx.fillRect(qrX + 8, qrY + 8, innerSize, innerSize)
          ctx.fillRect(qrX + qrSize - innerSize - 8, qrY + 8, innerSize, innerSize)
          ctx.fillRect(qrX + 8, qrY + qrSize - innerSize - 8, innerSize, innerSize)
          ctx.fillRect(qrX + qrSize / 2 - 4, qrY + qrSize / 2 - 4, 8, 8)

          // Subtext
          ctx.font = `14px monospace`
          ctx.fillStyle = el.color || "#000000"
          ctx.textAlign = "center"
          ctx.fillText("VALIDACIÓN QR", xPx, yPx + qrSize / 2 + 20)
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

        ctx.fillText(text, xPx, yPx)
      })

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `CERT-PRUEBA-${templateName.replace(/\s+/g, "_").toUpperCase()}.png`
      link.href = dataUrl
      link.click()
      toast.success("Prueba de certificado descargada con éxito.", { id: "rendering-cert" })
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
          <Button variant="outline" size="sm" onClick={handleTestDownload} className="text-xs gap-1.5 cursor-pointer">
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
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    {/* Drag Handle */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-0.5 bg-primary text-[9px] text-primary-foreground font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none">
                      <Move className="size-2.5" />
                      <span>{el.label}</span>
                    </div>

                    {el.id === "qr" ? (
                      <div
                        className="bg-white border-2 border-slate-900 flex flex-col items-center justify-center p-1.5 rounded"
                        style={{
                          width: `${(el.qrSize || 120) * 0.5}px`,
                          height: `${(el.qrSize || 120) * 0.5}px`
                        }}
                      >
                        {/* Fake QR lines */}
                        <div className="w-full h-full border border-slate-900 border-dashed rounded relative flex items-center justify-center">
                          <span className="text-[7px] font-bold text-slate-800 tracking-tighter">QR VALIDAR</span>
                          {/* Inner corner blocks */}
                          <div className="absolute top-0.5 left-0.5 size-2 bg-slate-900" />
                          <div className="absolute top-0.5 right-0.5 size-2 bg-slate-900" />
                          <div className="absolute bottom-0.5 left-0.5 size-2 bg-slate-900" />
                        </div>
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
                          whiteSpace: "nowrap"
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
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Elementos de Texto</h3>
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
    </div>
  )
}
