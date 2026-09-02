import React, { useState, useRef, useEffect } from "react"
import { Trash2, Loader2, Images, ImagePlus, RefreshCw, Upload, X, CheckCircle2, Eye } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { MediaLibraryDialog } from "@/components/MediaLibraryDialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploadWithPreviewProps {
  value: string
  onChange: (value: string) => void
  label?: string
  aspectRatio?: "square" | "banner" | "favicon"
  placeholder?: string
  folder?: string
  identifier?: string
  showUrlInput?: boolean
  /** Recurso dueño de la imagen. La carga siempre pasa por el API. */
  assetTarget?: { organizationId?: string; type: string; resourceId?: string }
  onFileSelect?: (file: File) => void
  /** Llamado al completar la carga en el API para persistir la URL de portada heredada. */
  onR2UploadComplete?: (publicUrl: string) => Promise<void>
  disabled?: boolean
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function ImageUploadWithPreview({
  value,
  onChange,
  label,
  aspectRatio = "square",
  placeholder = "Arrastra o selecciona una imagen",
  folder: _folder = "general",
  identifier: _identifier = "file",
  assetTarget,
  onFileSelect,
  onR2UploadComplete,
  disabled = false,
}: ImageUploadWithPreviewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(value || "")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string>("")
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [fullViewOpen, setFullViewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar valor entrante
  useEffect(() => {
    setPreviewUrl(value || "")
  }, [value])

  // Limpiar memoria de previews locales
  useEffect(() => {
    return () => {
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview)
      }
    }
  }, [pendingPreview])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleStageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo seleccionado no es una imagen válida.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen excede el límite de tamaño de 10MB.")
      return
    }

    // Si viene onFileSelect (por ej. modo creación diferida sin entity ID)
    if (onFileSelect) {
      const localUrl = URL.createObjectURL(file)
      if (pendingPreview) URL.revokeObjectURL(pendingPreview)
      setPendingFile(file)
      setPendingPreview(localUrl)
      onChange(localUrl)
      onFileSelect(file)
      return
    }

    // Modo con assetTarget: previsualizar y esperar clic en "Subir"
    const localUrl = URL.createObjectURL(file)
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(file)
    setPendingPreview(localUrl)
  }

  const cancelPending = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(null)
    setPendingPreview("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleConfirmUpload = async () => {
    if (!pendingFile) return
    if (!assetTarget) {
      toast.error("Falta la configuración de destino del archivo.")
      return
    }

    setIsUploading(true)
    try {
      const normalizedType = assetTarget.type.startsWith("organizations/")
        ? "ORGANIZATION"
        : assetTarget.type.startsWith("editions/")
        ? "EDITION"
        : assetTarget.type.startsWith("profiles/")
        ? "PROFILE"
        : "EVENT"

      const purpose = assetTarget.type.endsWith("/cover")
        ? "COVER"
        : assetTarget.type.endsWith("/logo")
        ? "LOGO"
        : "GALLERY"

      const media = await api.media.upload(pendingFile, {
        ownerType: normalizedType,
        ownerId: assetTarget.resourceId || "",
        purpose,
        organizationId: assetTarget.organizationId,
      })

      const publicUrl = media.url as string
      onChange(publicUrl)
      setPreviewUrl(publicUrl)

      if (onR2UploadComplete) {
        try {
          await onR2UploadComplete(publicUrl)
        } catch (dbErr) {
          console.error("onR2UploadComplete failed:", dbErr)
        }
      }

      toast.success("Imagen subida exitosamente")
      cancelPending()
    } catch (uploadErr: any) {
      console.error("Media upload failed:", uploadErr)
      toast.error(`No se pudo subir la imagen. ${uploadErr.message || uploadErr}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleStageFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleStageFile(e.target.files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cancelPending()
    onChange("")
    setPreviewUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast.success("Imagen eliminada")
  }

  const ownerType = assetTarget?.type.startsWith("organizations/")
    ? "ORGANIZATION"
    : assetTarget?.type.startsWith("editions/")
    ? "EDITION"
    : assetTarget?.type.startsWith("profiles/")
    ? "PROFILE"
    : "EVENT"

  const purpose = assetTarget?.type.endsWith("/cover")
    ? "COVER"
    : assetTarget?.type.endsWith("/logo")
    ? "LOGO"
    : "GALLERY"

  const applyFromLibrary = async (url: string) => {
    cancelPending()
    onChange(url)
    setPreviewUrl(url)
    if (onR2UploadComplete) await onR2UploadComplete(url)
    toast.success("Imagen aplicada desde la biblioteca")
  }

  // Clases según proporción
  const getContainerDimensions = () => {
    switch (aspectRatio) {
      case "banner":
        return "w-full min-h-[160px] md:min-h-[180px] max-h-[220px] aspect-[21/9]"
      case "favicon":
        return "size-20 aspect-square"
      case "square":
      default:
        return "size-40 sm:size-44 aspect-square"
    }
  }

  const isShowingPending = Boolean(pendingFile && pendingPreview && !onFileSelect)
  const currentDisplayUrl = isShowingPending ? pendingPreview : previewUrl

  return (
    <div className="w-full space-y-3">
      {label && <label className="text-sm font-medium text-foreground block">{label}</label>}

      <div className="flex flex-col gap-3 items-start w-full">
        {/* Contenedor principal / Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!currentDisplayUrl && !disabled) fileInputRef.current?.click()
          }}
          className={cn(
            "relative group rounded-xl overflow-hidden transition-all duration-200 select-none",
            getContainerDimensions(),
            // Bordes y fondo según estado
            !currentDisplayUrl && !isShowingPending
              ? cn(
                  "border border-dashed flex flex-col items-center justify-center cursor-pointer",
                  dragActive
                    ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                    : "border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40"
                )
              : "border border-border/70 bg-card shadow-xs"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
          />

          {/* ESTADO 1: Hay imagen activa o previsualización */}
          {currentDisplayUrl ? (
            <div className="size-full relative flex items-center justify-center bg-black/5 dark:bg-black/20">
              <img
                src={currentDisplayUrl}
                alt="Vista previa"
                className={cn(
                  "size-full transition-transform duration-300",
                  aspectRatio === "favicon" ? "object-contain p-2" : "object-cover"
                )}
              />

              {/* Tag de previsualización pendiente */}
              {isShowingPending && (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/90 text-white shadow-xs backdrop-blur-xs">
                    <span className="size-1.5 rounded-full bg-white animate-pulse" />
                    Vista previa · Listo para subir
                  </span>
                </div>
              )}

              {/* Acciones flotantes en hover (si ya está confirmada) */}
              {!isShowingPending && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-200 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                    className="p-2 bg-background/90 hover:bg-background text-foreground rounded-lg transition-transform hover:scale-105 shadow-sm text-xs flex items-center gap-1.5 font-medium"
                    title="Cambiar imagen"
                  >
                    <RefreshCw className="size-3.5" />
                    <span className="hidden sm:inline">Cambiar</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFullViewOpen(true)
                    }}
                    className="p-2 bg-background/90 hover:bg-background text-foreground rounded-lg transition-transform hover:scale-105 shadow-sm"
                    title="Ver en grande"
                  >
                    <Eye className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg transition-transform hover:scale-105 shadow-sm"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Spinner si está subiendo */}
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2 backdrop-blur-xs z-20">
                  <Loader2 className="size-6 text-primary animate-spin" />
                  <span className="text-xs font-medium text-foreground">Subiendo imagen...</span>
                </div>
              )}
            </div>
          ) : (
            /* ESTADO 2: Vacío - Minimalista */
            <div className="p-4 text-center flex flex-col items-center justify-center space-y-2.5">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary",
                  dragActive && "bg-primary/20 text-primary scale-110"
                )}
              >
                <ImagePlus className="size-5" />
              </div>

              {aspectRatio !== "favicon" ? (
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="text-xs font-medium text-foreground">
                    {placeholder || "Arrastra o selecciona una imagen"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    PNG, JPG o WEBP · Máx. 10MB
                  </p>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">Favicon</span>
              )}
            </div>
          )}
        </div>

        {/* BARRA DE CONFIRMACIÓN PENDIENTE (Previsualización -> Botón Subir) */}
        {isShowingPending && pendingFile && (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                <Upload className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate max-w-[240px]">
                  {pendingFile.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(pendingFile.size)} · Listo para cargar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={cancelPending}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 size-3.5" />
                Descartar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUploading}
                onClick={handleConfirmUpload}
                className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    Subir imagen
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Acciones auxiliares: Biblioteca Multimedia y Cambiar */}
        <div className="flex flex-wrap items-center gap-2">
          {assetTarget && !onFileSelect && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs font-medium border-border/80 text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/50"
              onClick={() => setLibraryOpen(true)}
            >
              <Images className="mr-1.5 size-3.5" />
              Biblioteca multimedia
            </Button>
          )}

          {previewUrl && !isShowingPending && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className="mr-1.5 size-3" />
              Reemplazar archivo
            </Button>
          )}
        </div>
      </div>

      {/* Modal de visor completo */}
      {fullViewOpen && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setFullViewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setFullViewOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-md"
            >
              <X className="size-6" />
            </button>
            <img
              src={previewUrl}
              alt="Vista previa ampliada"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Modal de Biblioteca Multimedia */}
      {assetTarget && (
        <MediaLibraryDialog
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          organizationId={assetTarget.organizationId || ""}
          ownerType={ownerType}
          ownerId={assetTarget.resourceId || ""}
          purpose={purpose}
          multiple={false}
          title={label || "Seleccionar imagen"}
          onChange={(items) => {
            const item = items[0]
            if (item) void applyFromLibrary(item.url)
          }}
        />
      )}
    </div>
  )
}
