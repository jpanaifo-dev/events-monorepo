import React, { useEffect, useRef, useState } from "react"
import {
  Film,
  ImagePlus,
  Star,
  Trash2,
  Upload,
  X,
  Loader2,
  Images,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { Button } from "@/components/ui/button"
import { MediaLibraryDialog } from "@/components/MediaLibraryDialog"
import { cn } from "@/lib/utils"

export type MediaItem = {
  id: string
  mediaId: string
  url: string
  mimeType: string
  orientation?: string
  position: number
  isFeatured: boolean
}

type PendingFile = {
  id: string
  file: File
  preview: string
  isVideo: boolean
  orientation: "LANDSCAPE" | "PORTRAIT" | "SQUARE" | "VIDEO" | "OTHER"
}

interface EventGalleryHeroManagerProps {
  eventId: string
  organizationId?: string
  maxItems?: number
  onGalleryCountChange?: (count: number) => void
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

async function getOrientation(file: File): Promise<PendingFile["orientation"]> {
  if (file.type.startsWith("video/")) return "VIDEO"
  if (!file.type.startsWith("image/")) return "OTHER"
  const src = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = reject
      image.src = src
    })
    return image.width === image.height
      ? "SQUARE"
      : image.width > image.height
      ? "LANDSCAPE"
      : "PORTRAIT"
  } catch {
    return "OTHER"
  } finally {
    URL.revokeObjectURL(src)
  }
}

export function EventGalleryHeroManager({
  eventId,
  organizationId,
  maxItems = 10,
  onGalleryCountChange,
}: EventGalleryHeroManagerProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [pending, setPending] = useState<PendingFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalCount = items.length + pending.length
  const remainingSlots = Math.max(0, maxItems - totalCount)

  // Cargar galería activa
  const refresh = async () => {
    if (!eventId) return
    try {
      const links = await api.media.list("EVENT", eventId)
      const mapped: MediaItem[] = links.map((link: any) => ({
        id: link.id,
        mediaId: link.mediaId,
        url: link.media.url,
        mimeType: link.media.mimeType,
        orientation: link.media.orientation,
        position: link.position,
        isFeatured: Boolean(link.isFeatured),
      }))
      setItems(mapped)
      onGalleryCountChange?.(mapped.length)
    } catch (err: any) {
      console.error("Error loading event media:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [eventId])

  // Limpiar memoria de previews
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  }, [pending])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleQueueFiles = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList)
    const validFiles = rawFiles.filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.type.startsWith("video/") ||
        f.type === "application/pdf"
    )

    if (!validFiles.length) {
      toast.error("Selecciona archivos de imagen o video válidos.")
      return
    }

    if (totalCount >= maxItems) {
      toast.error(`Ya has alcanzado el límite máximo de ${maxItems} archivos.`)
      return
    }

    const filesToProcess = validFiles.slice(0, remainingSlots)
    if (filesToProcess.length < validFiles.length) {
      toast.info(`Solo se agregaron ${filesToProcess.length} archivo(s) para no exceder el límite.`)
    }

    const staged: PendingFile[] = await Promise.all(
      filesToProcess.map(async (file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        isVideo: file.type.startsWith("video/"),
        orientation: await getOrientation(file),
      }))
    )

    setPending((current) => [...current, ...staged])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      void handleQueueFiles(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      void handleQueueFiles(e.target.files)
    }
    e.target.value = ""
  }

  const removePendingItem = (id: string) => {
    setPending((current) => {
      const item = current.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return current.filter((p) => p.id !== id)
    })
  }

  const clearAllPending = () => {
    pending.forEach((p) => URL.revokeObjectURL(p.preview))
    setPending([])
  }

  // Subir archivos encolados
  const handleUploadPending = async () => {
    if (!pending.length) return
    setIsUploading(true)
    let successCount = 0

    try {
      for (const item of pending) {
        try {
          await api.media.upload(item.file, {
            ownerType: "EVENT",
            ownerId: eventId,
            organizationId,
            purpose: "GALLERY",
            position: items.length + successCount,
            orientation: item.orientation,
          })
          successCount++
        } catch (err: any) {
          console.error(`Error uploading ${item.file.name}:`, err)
        }
      }

      clearAllPending()
      await refresh()

      if (successCount === pending.length) {
        toast.success(
          successCount === 1
            ? "Archivo multimedia subido correctamente"
            : `${successCount} archivos multimedia subidos correctamente`
        )
      } else {
        toast.warning(`Se subieron ${successCount} de ${pending.length} archivos.`)
      }
    } catch (err: any) {
      toast.error(err.message || "Error al subir los archivos.")
    } finally {
      setIsUploading(false)
    }
  }

  // Marcar como destacada para el Hero público
  const handleToggleFeatured = async (item: MediaItem) => {
    const isCurrentlyFeatured = item.isFeatured
    const updated = items.map((candidate) => ({
      ...candidate,
      isFeatured: candidate.id === item.id ? !isCurrentlyFeatured : false,
    }))

    setItems(updated)

    try {
      await api.media.reorder(
        "EVENT",
        eventId,
        updated.map((candidate, position) => ({
          id: candidate.id,
          position,
          isFeatured: candidate.isFeatured,
        }))
      )
      if (!isCurrentlyFeatured) {
        toast.success("Pieza marcada como destacada para el Hero público ⭐")
      } else {
        toast.info("Pieza desmarcada del Hero público")
      }
    } catch (err: any) {
      toast.error("Error al actualizar la pieza destacada.")
      void refresh()
    }
  }

  // Eliminar elemento de la galería
  const handleRemoveItem = async (item: MediaItem) => {
    try {
      await api.media.unlink(item.id)
      setItems((current) => current.filter((c) => c.id !== item.id))
      onGalleryCountChange?.(items.length - 1)
      toast.success("Recurso eliminado de la galería")
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar el recurso.")
      void refresh()
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Cabecera / Contador minimalista */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            Archivos · {items.length}/{maxItems}
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            · Admite imágenes (JPG, PNG, WEBP) y videos (MP4, WEBM)
          </span>
        </div>

        {organizationId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLibraryOpen(true)}
            className="h-7 text-xs px-2.5 rounded-lg border-border/80 text-muted-foreground hover:text-foreground bg-muted/20"
          >
            <Images className="mr-1.5 size-3.5" />
            Biblioteca multimedia
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* ZONA DE ARRASTRE MINIMALISTA */}
      {totalCount < maxItems && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative flex flex-col items-center justify-center p-6 rounded-xl border border-dashed cursor-pointer transition-all duration-200 select-none",
            dragActive
              ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[0.99]"
              : "border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <ImagePlus className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Arrastra archivos de galería o selecciónalos
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Puedes seleccionar múltiples imágenes o videos a la vez
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PREVISUALIZACIÓN ANTES DE SUBIR (STAGING QUEUE) */}
      {pending.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              <Upload className="size-4" />
              <span>
                {pending.length} archivo{pending.length > 1 ? "s" : ""} listo
                {pending.length > 1 ? "s" : ""} para subir (previsualización previa)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading}
                onClick={clearAllPending}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Descartar todo
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUploading}
                onClick={handleUploadPending}
                className="h-7 px-3 text-xs font-medium gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Subiendo ({pending.length})...
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    Subir {pending.length > 1 ? `(${pending.length}) archivos` : "archivo"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tarjetas de previsualización en lote */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-lg border border-border/80 bg-background overflow-hidden shadow-xs flex flex-col"
              >
                <div className="relative aspect-video w-full bg-muted/40 overflow-hidden flex items-center justify-center">
                  {p.isVideo ? (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Film className="size-6 text-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Video</span>
                    </div>
                  ) : (
                    <img
                      src={p.preview}
                      alt={p.file.name}
                      className="size-full object-cover"
                    />
                  )}

                  {/* Botón descartar individual */}
                  <button
                    type="button"
                    onClick={() => removePendingItem(p.id)}
                    disabled={isUploading}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-destructive text-white transition-colors"
                    title="Descartar este archivo"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="p-2 text-[11px] bg-card border-t border-border/50">
                  <p className="font-medium text-foreground truncate">{p.file.name}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">
                    {formatBytes(p.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUADRÍCULA DE ELEMENTOS ACTIVOS EN EL EVENTO */}
      {items.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Multimedia activa</span>
            <span>⭐ Haz clic en la estrella para usarlo en el Hero público</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative rounded-xl border bg-card overflow-hidden shadow-xs transition-all duration-200 flex flex-col",
                  item.isFeatured
                    ? "border-amber-500/80 ring-2 ring-amber-500/20 shadow-md"
                    : "border-border/80 hover:border-primary/50"
                )}
              >
                {/* Visualizador de imagen / video */}
                <div className="relative aspect-video w-full bg-muted/40 overflow-hidden flex items-center justify-center">
                  {item.mimeType.startsWith("video/") ? (
                    <div className="size-full relative">
                      <video
                        src={item.url}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] flex items-center gap-1">
                        <Film className="size-3" />
                        <span>Video</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt="Multimedia del evento"
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Badge de Hero Destacado */}
                  {item.isFeatured && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-white shadow-xs">
                        <Star className="size-3 fill-current" />
                        Hero Público
                      </span>
                    </div>
                  )}

                  {/* Acciones flotantes en hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item)}
                      className={cn(
                        "p-2 rounded-lg transition-transform hover:scale-110 shadow-sm text-xs flex items-center gap-1 font-medium",
                        item.isFeatured
                          ? "bg-amber-500 text-white"
                          : "bg-background/90 text-foreground hover:bg-amber-500 hover:text-white"
                      )}
                      title={
                        item.isFeatured
                          ? "Quitar del Hero público"
                          : "Destacar en el Hero público"
                      }
                    >
                      <Star
                        className={cn("size-4", item.isFeatured && "fill-current")}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      className="p-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg transition-transform hover:scale-110 shadow-sm"
                      title="Eliminar de la galería"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Biblioteca Multimedia de la organización */}
      {organizationId && (
        <MediaLibraryDialog
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          organizationId={organizationId}
          ownerType="EVENT"
          ownerId={eventId}
          multiple
          maxItems={maxItems}
          title="Biblioteca Multimedia del Evento"
          onChange={() => void refresh()}
        />
      )}
    </div>
  )
}
