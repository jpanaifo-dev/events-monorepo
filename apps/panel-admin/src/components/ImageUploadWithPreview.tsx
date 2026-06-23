import React, { useState, useRef, useEffect } from "react"
import { Upload, Trash2, Link2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { uploadToR2, deleteFromR2 } from "@/utils/r2-storage"

interface ImageUploadWithPreviewProps {
  value: string
  onChange: (value: string) => void
  label: string
  aspectRatio?: "square" | "banner" | "favicon"
  placeholder?: string
  folder?: string
  identifier?: string
  onFileSelect?: (file: File) => void
  /** Llamado SOLO cuando el archivo se subió exitosamente a R2 (modo edición directa).
   *  Recibe la URL pública de R2. Úsalo para persistir en BD automáticamente. */
  onR2UploadComplete?: (publicUrl: string) => Promise<void>
}

export function ImageUploadWithPreview({
  value,
  onChange,
  label,
  aspectRatio = "square",
  placeholder = "Arrastra y suelta una imagen aquí, o pega un enlace abajo",
  folder = "general",
  identifier = "file",
  onFileSelect,
  onR2UploadComplete
}: ImageUploadWithPreviewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")
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
      // Attempt to delete old image from R2 if one was present
      if (value) {
        try {
          await deleteFromR2(value)
        } catch (delErr) {
          console.warn("Failed to delete old image from R2:", delErr)
        }
      }

      // Upload to Cloudflare R2
      try {
        const publicUrl = await uploadToR2(file, folder, identifier)
        // 1. Actualizar URL en el estado del padre
        onChange(publicUrl)
        // 2. Si hay callback de auto-guardado en BD, invocarlo (modo edición)
        if (onR2UploadComplete) {
          try {
            await onR2UploadComplete(publicUrl)
          } catch (dbErr) {
            console.error("onR2UploadComplete failed:", dbErr)
            toast.error("La imagen se subió a R2 pero no se pudo guardar en la base de datos.")
          }
        } else {
          toast.success("Imagen subida exitosamente")
        }
      } catch (uploadErr: any) {
        console.error("R2 upload failed:", uploadErr)
        toast.error(`Error al subir la imagen a Cloudflare R2. Verifica que las credenciales y las reglas CORS estén configuradas en R2. Detalle: ${uploadErr.message || uploadErr}`)
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
    const oldUrl = value
    onChange("")
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (onFileSelect) {
      // If we are in lazy upload mode, notify parent that file is removed
      toast.success("Imagen removida")
      return
    }

    if (oldUrl) {
      try {
        await deleteFromR2(oldUrl)
        toast.success("Imagen eliminada de R2")
      } catch (err) {
        console.error("Failed to delete from R2:", err)
        toast.success("Imagen removida localmente")
      }
    } else {
      toast.success("Imagen removida")
    }
  }

  // Define aspect ratio classes
  const getContainerClass = () => {
    const base = "relative group border border-dashed rounded-xl overflow-hidden bg-muted/20 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer"
    const hoverBorder = dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-muted/30"

    switch (aspectRatio) {
      case "banner":
        return `${base} ${hoverBorder} aspect-[21/9] w-full max-w-full`
      case "favicon":
        return `${base} ${hoverBorder} size-20 aspect-square max-w-[80px]`
      case "square":
      default:
        return `${base} ${hoverBorder} size-40 aspect-square max-w-[160px]`
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

  return (
    <div className="space-y-3 w-full">
      <label className="text-sm font-medium text-foreground block">{label}</label>

      <div className="flex flex-col gap-4 items-start w-full">
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
                  onClick={handleRemove}
                  className="p-2 bg-destructive/90 hover:bg-destructive text-white rounded-lg transition-transform hover:scale-105"
                  title="Eliminar imagen"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center flex flex-col items-center justify-center space-y-2 select-none">
              {isUploading ? (
                <Loader2 className="size-6 text-primary animate-spin" />
              ) : (
                <Upload className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              {aspectRatio !== "favicon" && (
                <span className="text-[10px] text-muted-foreground text-center line-clamp-2 max-w-[130px]">
                  {placeholder}
                </span>
              )}
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/75 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="size-5 text-primary animate-spin" />
                <span className="text-[9px] text-muted-foreground font-medium">Subiendo...</span>
              </div>
            </div>
          )}
        </div>

        {/* URL Input Area */}
        <div className="flex-1 w-full space-y-2">
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://ejemplo.com/imagen.png"
              value={value.startsWith("data:image") ? "" : value}
              onChange={(e) => onChange(e.target.value)}
              className="pl-9 bg-card text-xs"
              disabled={isUploading}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            O si prefieres, pega la dirección directa de una imagen web. Las subidas por arrastre se guardarán en R2.
          </p>
        </div>
      </div>
    </div>
  )
}
