import React, { useState, useRef, useEffect } from "react"
import { Trash2, Loader2, Images, ImagePlus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { MediaLibraryDialog } from "@/components/MediaLibraryDialog"
import { Button } from "@/components/ui/button"

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
  assetTarget?: { organizationId?: string; type: string; resourceId: string }
  onFileSelect?: (file: File) => void
  /** Llamado al completar la carga en el API para persistir la URL de portada heredada. */
  onR2UploadComplete?: (publicUrl: string) => Promise<void>
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
  onR2UploadComplete
}: ImageUploadWithPreviewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [libraryOpen, setLibraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync preview with incoming value
  useEffect(() => {
    setPreviewUrl(value || "")
  }, [value])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo seleccionado no es una imagen válida.")
      return
    }

    // Validate size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen excede el límite de tamaño de 5MB.")
      return
    }

    if (onFileSelect) {
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      onChange(localUrl)
      onFileSelect(file)
      return
    }

    setIsUploading(true)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl) // Show local preview instantly

    try {
      try {
        if (!assetTarget) throw new Error("Indica el recurso que recibirá esta imagen.")
        const normalizedType = assetTarget.type.startsWith("organizations/") ? "ORGANIZATION" : assetTarget.type.startsWith("editions/") ? "EDITION" : "EVENT"
        const purpose = assetTarget.type.endsWith("/cover") ? "COVER" : assetTarget.type.endsWith("/logo") ? "LOGO" : "GALLERY"
        const media = await api.media.upload(file, { ownerType: normalizedType, ownerId: assetTarget.resourceId, purpose, organizationId: assetTarget.organizationId })
        const publicUrl = media.url as string
        // 1. Actualizar URL en el estado del padre
        onChange(publicUrl)
        // 2. Si hay callback de auto-guardado en BD, invocarlo (modo edición)
        if (onR2UploadComplete) {
          try {
            await onR2UploadComplete(publicUrl)
          } catch (dbErr) {
            console.error("onR2UploadComplete failed:", dbErr)
            toast.error("La imagen se subió, pero no se pudo guardar su referencia.")
          }
        } else {
          toast.success("Imagen subida exitosamente")
        }
      } catch (uploadErr: any) {
        console.error("Media upload failed:", uploadErr)
        toast.error(`No se pudo subir la imagen. ${uploadErr.message || uploadErr}`)
        setPreviewUrl(value || "")
      }
    } catch (err: any) {
      console.error("Error processing image upload:", err)
      toast.error("Ocurrió un error al procesar la imagen.")
      setPreviewUrl(value || "")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0])
    }
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange("")
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (onFileSelect) {
      toast.success("Imagen removida")
      return
    }

    toast.success("Imagen removida")
  }

  // Define aspect ratio classes
  const getContainerClass = () => {
    const base = "relative group border-2 border-dashed rounded-2xl overflow-hidden bg-muted/20 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer"
    const hoverBorder = dragActive
      ? "border-primary bg-primary/5 shadow-inner"
      : "border-border hover:border-primary/60 hover:bg-muted/40"

    switch (aspectRatio) {
      case "banner":
        return `${base} ${hoverBorder} aspect-[21/9] w-full min-h-[160px]`
      case "favicon":
        return `${base} ${hoverBorder} size-20 aspect-square max-w-[80px]`
      case "square":
      default:
        return `${base} ${hoverBorder} size-44 aspect-square max-w-[176px]`
    }
  }

  const getPreviewImageClass = () => {
    switch (aspectRatio) {
      case "banner":
        return "w-full h-full object-cover"
      case "favicon":
        return "size-full object-contain p-2"
      case "square":
      default:
        return "size-full object-cover"
    }
  }

  const ownerType = assetTarget?.type.startsWith("organizations/") ? "ORGANIZATION" : assetTarget?.type.startsWith("editions/") ? "EDITION" : assetTarget?.type.startsWith("profiles/") ? "PROFILE" : "EVENT"
  const purpose = assetTarget?.type.endsWith("/cover") ? "COVER" : assetTarget?.type.endsWith("/logo") ? "LOGO" : "GALLERY"
  const applyFromLibrary = async (url: string) => {
    onChange(url)
    if (onR2UploadComplete) await onR2UploadComplete(url)
  }

  return (
    <div className="space-y-2.5 w-full">
      {label && <label className="text-sm font-medium text-foreground block">{label}</label>}

      <div className="flex flex-col gap-2.5 items-start w-full">
        {/* Dropzone Container */}
        <div
          className={getContainerClass()}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {previewUrl ? (
            <div className="size-full relative group">
              <img
                src={previewUrl}
                alt="Vista previa"
                className={getPreviewImageClass()}
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="p-2.5 bg-neutral-900/90 hover:bg-neutral-900 text-white rounded-xl transition-transform hover:scale-105 shadow-md"
                  title="Cambiar imagen"
                >
                  <RefreshCw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2.5 bg-destructive/90 hover:bg-destructive text-white rounded-xl transition-transform hover:scale-105 shadow-md"
                  title="Eliminar imagen"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center flex flex-col items-center justify-center space-y-2 select-none">
              {isUploading ? (
                <Loader2 className="size-7 text-primary animate-spin" />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                  <ImagePlus className="size-5" />
                </span>
              )}
              {aspectRatio !== "favicon" ? (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground block">
                    {placeholder || "Agregar archivo"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    O arrastra y suelta
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">Favicon</span>
              )}
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-xs">
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="size-6 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">Subiendo imagen...</span>
              </div>
            </div>
          )}
        </div>

        {/* Action button for Media Library if assetTarget is provided */}
        {assetTarget && !onFileSelect && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs font-medium border-border"
              onClick={() => setLibraryOpen(true)}
            >
              <Images className="mr-1.5 size-3.5 text-muted-foreground" />
              Biblioteca multimedia
            </Button>
          </div>
        )}
      </div>

      {assetTarget && (
        <MediaLibraryDialog
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          organizationId={assetTarget.organizationId || ""}
          ownerType={ownerType}
          ownerId={assetTarget.resourceId}
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
