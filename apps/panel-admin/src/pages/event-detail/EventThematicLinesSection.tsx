import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { z } from "zod"
import { useEventStore, type ThematicLine } from "@/store/event.store"
import { Plus, Trash2, Edit, BookOpen, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

import { useSEO } from "@/hooks/use-seo"

const PRESETS_COLORS = [
  { name: "Azul", hex: "#3b82f6" },
  { name: "Esmeralda", hex: "#10b981" },
  { name: "Rojo", hex: "#ef4444" },
  { name: "Violeta", hex: "#8b5cf6" },
  { name: "Naranja", hex: "#f97316" },
  { name: "Rosa", hex: "#ec4899" },
]

export function EventThematicLinesSection() {
  const { id } = useParams<{ id: string }>()
  const { events, editions, thematicLines, loadThematicLines, addThematicLine, updateThematicLine, deleteThematicLine } = useEventStore()

  const event = events.find((e) => e.id === id)
  const eventEditions = editions.filter((ed) => ed.mainEventId === id)
  const currentEdition = eventEditions.find((ed) => ed.isCurrent)

  useSEO({
    title: event ? `${event.name} - Líneas Temáticas` : "Líneas Temáticas del Evento",
    description: `Configura las líneas temáticas de contenido para el evento ${event?.name || ""}.`
  })

  // Load thematic lines on mount or when id changes
  useEffect(() => {
    if (id) {
      loadThematicLines(id)
    }
  }, [id, loadThematicLines])

  // Filter states
  // Default filtering to the current edition's ID if one is active, otherwise default to "all"
  const [selectedEditionFilter, setSelectedEditionFilter] = useState<string>("all")

  useEffect(() => {
    if (currentEdition) {
      setSelectedEditionFilter(currentEdition.id)
    } else {
      setSelectedEditionFilter("all")
    }
  }, [currentEdition])

  // Form states
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [colorHex, setColorHex] = useState("#3b82f6")
  const [iconUrl, setIconUrl] = useState("")
  const [isEditionSpecific, setIsEditionSpecific] = useState(true)
  const [formEditionId, setFormEditionId] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [formError, setFormError] = useState("")

  // Set default edition ID in form when isEditionSpecific changes or sheet is opened
  useEffect(() => {
    if (isEditionSpecific && currentEdition && !formEditionId) {
      setFormEditionId(currentEdition.id)
    }
  }, [isEditionSpecific, currentEdition, formEditionId])

  const openCreate = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setColorHex("#3b82f6")
    setIconUrl("")
    setIsEditionSpecific(true)
    setFormEditionId(currentEdition?.id || "")
    setIsActive(true)
    setFormError("")
    setIsSheetOpen(true)
  }

  const openEdit = (tl: ThematicLine) => {
    setEditingId(tl.id)
    setName(tl.name)
    setDescription(tl.description || "")
    setColorHex(tl.colorHex || "#3b82f6")
    setIconUrl(tl.iconUrl || "")
    setIsEditionSpecific(!!tl.editionId)
    setFormEditionId(tl.editionId || currentEdition?.id || "")
    setIsActive(tl.isActive)
    setFormError("")
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setFormError("")
  }

  // Zod form validation schema
  const thematicLineFormSchema = z.object({
    name: z.string().trim().min(1, "El nombre de la línea temática es obligatorio."),
    description: z.string().trim().optional(),
    colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser un código hexadecimal válido (ej. #3b82f6)."),
    iconUrl: z.string().trim().url("El enlace del icono debe ser una URL válida.").or(z.literal("")).optional(),
    editionId: z.string().nullable(),
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    const targetEditionId = isEditionSpecific ? (formEditionId || null) : null

    const validation = thematicLineFormSchema.safeParse({
      name,
      description,
      colorHex,
      iconUrl,
      editionId: targetEditionId,
    })

    if (!validation.success) {
      setFormError(validation.error.issues[0].message)
      return
    }

    const payload = {
      mainEventId: id!,
      editionId: targetEditionId,
      name: name.trim(),
      description: description.trim() || null,
      iconUrl: iconUrl.trim() || null,
      colorHex,
      isActive,
    }

    try {
      if (editingId) {
        await updateThematicLine(editingId, payload)
        toast.success("Línea temática actualizada correctamente")
      } else {
        await addThematicLine(payload)
        toast.success("Línea temática agregada correctamente")
      }
      closeSheet()
    } catch (err: any) {
      console.error(err)
      setFormError(err?.message || "Ocurrió un error al guardar la línea temática.")
    }
  }

  const handleDelete = async (tlId: string) => {
    try {
      await deleteThematicLine(tlId)
      toast.success("Línea temática eliminada correctamente")
    } catch (err: any) {
      console.error(err)
      toast.error("Ocurrió un error al eliminar la línea temática")
    }
  }

  // Filter computed list
  const filteredLines = thematicLines
    .filter((tl) => tl.mainEventId === id)
    .filter((tl) => {
      if (selectedEditionFilter === "all") return true
      if (selectedEditionFilter === "global") return tl.editionId === null
      return tl.editionId === selectedEditionFilter
    })

  return (
    <div className="space-y-8 animate-in fade-in duration-200">

      {/* Title, Filters & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold">Líneas Temáticas</h3>
          <p className="text-xs text-muted-foreground">
            Gestiona los ejes temáticos y temas de interés del contenido científico u operativo de tu evento.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Filtrar por:</span>
            <Select value={selectedEditionFilter} onValueChange={setSelectedEditionFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Seleccionar edición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ediciones</SelectItem>
                <SelectItem value="global">Global (Sin edición)</SelectItem>
                {eventEditions.map((ed) => (
                  <SelectItem key={ed.id} value={ed.id}>
                    {ed.name} {ed.isCurrent ? "— [Actual]" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
            <Plus className="size-4 mr-1.5" />
            Nueva Línea Temática
          </Button>
        </div>
      </div>

      {/* Table list of thematic lines */}
      {filteredLines.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <BookOpen className="size-8 mx-auto opacity-40" />
          <div>
            <p className="font-semibold">No se encontraron líneas temáticas</p>
            <p className="text-xs text-muted-foreground">
              {selectedEditionFilter === "all"
                ? "Comienza creando una línea temática haciendo clic en el botón de arriba."
                : "No hay líneas registradas para este filtro de edición. Crea una o selecciona otro filtro."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-card/10 backdrop-blur-xs">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                <th className="p-3">Nombre / Descripción</th>
                <th className="p-3">Color</th>
                <th className="p-3">Ámbito (Aplicabilidad)</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredLines.map((tl) => {
                const isGlobal = !tl.editionId
                const targetEditionName = isGlobal
                  ? ""
                  : eventEditions.find((ed) => ed.id === tl.editionId)?.name || "Edición Desconocida"

                const bgClr = tl.colorHex || "#6b7280"
                return (
                  <tr key={tl.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-3 max-w-sm">
                      <div className="flex items-start gap-3">
                        {tl.iconUrl ? (
                          <img
                            src={tl.iconUrl}
                            alt={tl.name}
                            className="size-7 rounded-lg object-cover border border-border/80"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLElement).style.display = "none"
                            }}
                          />
                        ) : (
                          <div className="size-7 rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center text-muted-foreground">
                            <BookOpen className="size-3.5" />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm leading-tight text-foreground">{tl.name}</p>
                          {tl.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {tl.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-4 rounded border border-border/50 shadow-xs"
                          style={{ backgroundColor: bgClr }}
                        />
                        <code className="text-xs font-mono text-muted-foreground uppercase">{bgClr}</code>
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      {isGlobal ? (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          Global (Todas las ediciones)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          Edición: {targetEditionName}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${tl.isActive ? "text-emerald-500" : "text-muted-foreground"
                        }`}>
                        <span className={`size-1.5 rounded-full ${tl.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                        {tl.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button onClick={() => openEdit(tl)} variant="ghost" className="size-7 p-0">
                          <Edit className="size-3.5" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="size-7 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar línea temática?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará permanentemente la línea temática "{tl.name}". Esto puede remover la asociación en las ponencias o trabajos enviados que la utilicen. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(tl.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Sí, eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation/Editing Sheet Form */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Línea Temática" : "Nueva Línea Temática"}</SheetTitle>
            <SheetDescription>
              Define el nombre, descripción, color característico y ámbito para clasificar las ponencias de este evento.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-5 px-4 mt-6 flex-1 overflow-y-auto pb-6">

            {formError && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium">
                {formError}
              </div>
            )}

            <FieldGroup>

              {/* Name */}
              <Field>
                <FieldLabel htmlFor="lineName">Nombre *</FieldLabel>
                <Input
                  id="lineName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Inteligencia Artificial y Machine Learning"
                  required
                />
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="lineDesc">Descripción</FieldLabel>
                <textarea
                  id="lineDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe brevemente de qué trata esta línea temática..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>

              {/* Icon URL */}
              <Field>
                <FieldLabel htmlFor="lineIconUrl">Enlace de Icono / Imagen (URL)</FieldLabel>
                <Input
                  id="lineIconUrl"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://ejemplo.com/icono.png"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Enlace opcional a una imagen pequeña o icono descriptivo para mostrar al público.
                </p>
              </Field>

              {/* Color Customization */}
              <Field>
                <FieldLabel>Color Característico</FieldLabel>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {PRESETS_COLORS.map((clr) => (
                      <button
                        key={clr.hex}
                        type="button"
                        onClick={() => setColorHex(clr.hex)}
                        className={`size-6 rounded-full border transition-all relative ${colorHex === clr.hex
                          ? "border-primary scale-110 shadow-sm"
                          : "border-transparent hover:scale-105"
                          }`}
                        style={{ backgroundColor: clr.hex }}
                        title={clr.name}
                      >
                        {colorHex === clr.hex && (
                          <span className="absolute inset-0 flex items-center justify-center text-white">
                            <Check className="size-3" />
                          </span>
                        )}
                      </button>
                    ))}

                    {/* Custom picker */}
                    <div className="flex items-center gap-2 ml-1">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-7 h-7 rounded-md border border-border cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono font-medium text-muted-foreground uppercase">
                        {colorHex}
                      </span>
                    </div>
                  </div>
                </div>
              </Field>

              {/* Scope Switch (Global vs Edition) */}
              <div className="bg-muted/10 border border-border/60 p-4 rounded-xl space-y-4 mt-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="editionSpecificSwitch">
                      ¿Aplica solo para una edición?
                    </label>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Si está activado, la línea temática pertenecerá a una edición seleccionada. Desactivado será global para el evento.
                    </p>
                  </div>
                  <Switch
                    id="editionSpecificSwitch"
                    checked={isEditionSpecific}
                    onCheckedChange={setIsEditionSpecific}
                  />
                </div>

                {/* Dropdown with event editions - visible only if switch is ON */}
                {isEditionSpecific && (
                  <Field className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <FieldLabel htmlFor="formEditionSelect">Seleccionar Edición</FieldLabel>
                    {eventEditions.length === 0 ? (
                      <p className="text-xs text-amber-500 font-medium">
                        No hay ediciones creadas. Se creará de forma global o crea una edición primero.
                      </p>
                    ) : (
                      <Select value={formEditionId} onValueChange={setFormEditionId}>
                        <SelectTrigger id="formEditionSelect">
                          <SelectValue placeholder="Selecciona una edición" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventEditions.map((ed) => (
                            <SelectItem key={ed.id} value={ed.id}>
                              {ed.name} ({ed.year}) {ed.isCurrent ? "— [Actual]" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                )}
              </div>

              {/* Status Switch (Active / Inactive) */}
              <div className="flex items-center justify-between p-1">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="activeSwitch">
                    Línea activa
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Las líneas inactivas no se muestran en los formularios de envío de ponencias.
                  </p>
                </div>
                <Switch
                  id="activeSwitch"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

            </FieldGroup>
          </form>

          <SheetFooter className="mt-8 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={closeSheet}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="font-semibold">
              {editingId ? "Guardar Cambios" : "Crear Línea Temática"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
