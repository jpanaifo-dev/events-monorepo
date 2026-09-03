import { useEffect, useRef, useState } from "react"
import { Film, GripVertical, ImagePlus, Star, Upload, X, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type OwnerType = "ORGANIZATION" | "EVENT" | "EDITION" | "PROFILE"
type Purpose = "COVER" | "LOGO" | "GALLERY" | "DOCUMENT" | "OTHER"

export type MediaItem = {
  id: string
  mediaId: string
  url: string
  mimeType: string
  orientation?: string
  position: number
  isFeatured: boolean
}

type Pending = {
  id: string
  file: File
  preview: string
  orientation: "LANDSCAPE" | "PORTRAIT" | "SQUARE" | "VIDEO" | "OTHER"
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  ownerType: OwnerType
  ownerId: string
  purpose?: Purpose
  multiple?: boolean
  maxItems?: number
  title?: string
  onChange?: (items: MediaItem[]) => void
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

async function getOrientation(file: File): Promise<Pending["orientation"]> {
  if (file.type.startsWith("video/")) return "VIDEO"
  if (!file.type.startsWith("image/")) return "OTHER"
  const src = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((ok, bad) => {
      image.onload = () => ok()
      image.onerror = bad
      image.src = src
    })
    return image.width === image.height
      ? "SQUARE"
      : image.width > image.height
      ? "LANDSCAPE"
      : "PORTRAIT"
  } finally {
    URL.revokeObjectURL(src)
  }
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  organizationId,
  ownerType,
  ownerId,
  purpose = "GALLERY",
  multiple = false,
  maxItems = multiple ? 10 : 1,
  title = "Multimedia",
  onChange,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [library, setLibrary] = useState<any[]>([])
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const count = items.length + pending.length

  const refresh = async () => {
    if (!ownerId) return
    const [links, assets] = await Promise.all([
      api.media.list(ownerType, ownerId),
      organizationId ? api.media.library(organizationId) : Promise.resolve([]),
    ])
    const next = links.map((link: any) => ({
      id: link.id,
      mediaId: link.mediaId,
      url: link.media.url,
      mimeType: link.media.mimeType,
      orientation: link.media.orientation,
      position: link.position,
      isFeatured: link.isFeatured,
    }))
    setItems(next)
    onChange?.(next)
    setLibrary(assets)
  }

  useEffect(() => {
    if (open) {
      void refresh().catch((error) =>
        toast.error(error.message || "No se pudo cargar la biblioteca.")
      )
    }
  }, [open, ownerId, organizationId])

  useEffect(() => {
    return () => pending.forEach((item) => URL.revokeObjectURL(item.preview))
  }, [pending])

  const queue = async (files: FileList | File[]) => {
    const filesOk = Array.from(files)
      .filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.type.startsWith("video/") ||
          file.type === "application/pdf"
      )
      .slice(0, Math.max(0, maxItems - count))

    if (!filesOk.length) {
      return toast.error(
        `Puedes agregar un máximo de ${maxItems} archivo${maxItems === 1 ? "" : "s"}.`
      )
    }

    const next = await Promise.all(
      filesOk.map(async (file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        orientation: await getOrientation(file),
      }))
    )

    if (!multiple) {
      pending.forEach((item) => URL.revokeObjectURL(item.preview))
      setPending(next.slice(0, 1))
    } else {
      setPending((current) => [...current, ...next])
    }
  }

  const removePending = (id: string) => {
    setPending((current) => {
      const item = current.find((candidate) => candidate.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return current.filter((candidate) => candidate.id !== id)
    })
  }

  const submit = async () => {
    if (!pending.length) return
    setBusy(true)
    try {
      if (!multiple && items[0]) {
        await api.media.unlink(items[0].id)
      }
      for (const item of pending) {
        await api.media.upload(item.file, {
          ownerType,
          ownerId,
          organizationId,
          purpose,
          position: items.length,
          orientation: item.orientation,
        })
      }
      pending.forEach((item) => URL.revokeObjectURL(item.preview))
      setPending([])
      await refresh()
      toast.success("Archivos subidos correctamente")
      if (!multiple) onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "No se pudieron subir los archivos.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (item: MediaItem) => {
    try {
      await api.media.unlink(item.id)
      await refresh()
      toast.success("Recurso retirado")
    } catch (error: any) {
      toast.error(error.message || "No se pudo retirar el recurso.")
    }
  }

  const selectLibrary = async (asset: any) => {
    if (count >= maxItems && multiple) {
      return toast.error(`Máximo ${maxItems} archivos.`)
    }
    try {
      if (!multiple && items[0]) {
        await api.media.unlink(items[0].id)
      }
      await api.media.attach(asset.id, {
        ownerType,
        ownerId,
        purpose,
        position: items.length,
      })
      await refresh()
      toast.success("Archivo seleccionado")
      if (!multiple) onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "No se pudo usar ese archivo.")
    }
  }

  const feature = async (item: MediaItem) => {
    const next = items.map((candidate) => ({
      ...candidate,
      isFeatured: candidate.id === item.id ? !candidate.isFeatured : false,
    }))
    setItems(next)
    await api.media.reorder(
      ownerType,
      ownerId,
      next.map((candidate, position) => ({
        id: candidate.id,
        position,
        isFeatured: candidate.isFeatured,
      }))
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl p-6 shadow-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Arrastra o selecciona archivos, previsualízalos y confirma la subida.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          multiple={multiple}
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void queue(event.target.files)
            event.target.value = ""
          }}
        />

        {/* Zona activa y pendientes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Archivos · {count}/{maxItems}
            </span>
            <span>Máximo {maxItems} archivo{maxItems > 1 ? "s" : ""}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {items.map((item) => (
              <Tile
                key={item.id}
                src={item.url}
                mime={item.mimeType}
                onRemove={() => void remove(item)}
                onFeature={ownerType === "EVENT" ? () => void feature(item) : undefined}
                featured={item.isFeatured}
              />
            ))}

            {pending.map((item) => (
              <Tile
                key={item.id}
                src={item.preview}
                mime={item.file.type}
                name={item.file.name}
                size={item.file.size}
                pending
                onRemove={() => removePending(item.id)}
              />
            ))}

            {count < maxItems && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  void queue(event.dataTransfer.files)
                }}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-xs text-muted-foreground transition-all duration-200 cursor-pointer",
                  dragging
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-primary"
                    : "border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <ImagePlus className="size-4" />
                </div>
                <span className="font-medium">Añadir archivo</span>
              </button>
            )}
          </div>
        </section>

        {/* Acciones de carga de pendientes */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-1.5 size-3.5" />
            Explorar archivos
          </Button>

          {pending.length > 0 && (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void submit()}
              className="text-xs h-8 font-medium gap-1.5 bg-primary text-primary-foreground"
            >
              {busy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  Subir {pending.length > 1 ? `(${pending.length}) archivos` : "archivo"}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Biblioteca existente de la organización */}
        {organizationId && library.length > 0 && (
          <section className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground">
              Biblioteca de la organización ({library.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
              {library.map((asset) => (
                <button
                  type="button"
                  key={asset.id}
                  onClick={() => void selectLibrary(asset)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 text-left hover:border-primary transition-all duration-200"
                  title={asset.filename}
                >
                  {asset.mimeType?.startsWith("video/") ? (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <Film className="size-5 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      className="size-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <span className="absolute inset-x-0 bottom-0 block truncate bg-black/75 px-1 py-0.5 text-[9px] text-white">
                    {asset.filename}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Tile({
  src,
  mime,
  name,
  size,
  pending = false,
  featured = false,
  onRemove,
  onFeature,
}: {
  src: string
  mime: string
  name?: string
  size?: number
  pending?: boolean
  featured?: boolean
  onRemove: () => void
  onFeature?: () => void
}) {
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border bg-card shadow-xs transition-all",
        pending
          ? "border-amber-500/40 ring-1 ring-amber-500/20"
          : featured
          ? "border-amber-500 ring-2 ring-amber-500/20"
          : "border-border/80"
      )}
    >
      {mime.startsWith("video/") ? (
        <video src={src} className="size-full object-cover" muted />
      ) : (
        <img src={src} alt="Multimedia" className="size-full object-cover" />
      )}

      {/* Overlay inferior */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/75 px-2 py-1 text-[10px] text-white backdrop-blur-xs">
        <span className="truncate max-w-[70px]">
          {pending ? "Listo para subir" : <GripVertical className="size-3 text-muted-foreground" />}
        </span>
        <div className="flex items-center gap-1">
          {onFeature && (
            <button
              type="button"
              title="Destacar en el hero"
              onClick={onFeature}
              className={cn(
                "p-0.5 rounded transition-colors",
                featured ? "text-amber-400" : "text-white/70 hover:text-amber-400"
              )}
            >
              <Star className={cn("size-3.5", featured && "fill-current")} />
            </button>
          )}
          <button
            type="button"
            title="Quitar"
            onClick={onRemove}
            className="p-0.5 rounded text-white/70 hover:text-destructive transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
