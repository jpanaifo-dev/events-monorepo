import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { useEventStore, type Edition } from "@/store/event.store"
import { toast } from "sonner"
import { Plus, Trash2, Edit } from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { PageHeader } from "@/components/page-header"
import { api } from "@/api/client"

export function EventEditionsSection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, editions, addEdition, updateEdition, deleteEdition } = useEventStore()

  const event = events.find((e) => e.id === id)
  const [remoteEditions, setRemoteEditions] = useState<Edition[]>([])
  const [isLoadingEditions, setIsLoadingEditions] = useState(true)
  const eventEditions = (remoteEditions.length ? remoteEditions : editions.filter((ed) => ed.mainEventId === id))

  useEffect(() => {
    if (!id) return
    setIsLoadingEditions(true)
    api.editions.list(id)
      .then((rows) => setRemoteEditions(rows.map((row: any) => ({ id: row.id, mainEventId: row.mainEventId, name: row.name, startDate: row.startDate || "", endDate: row.endDate || "", slug: "", year: row.startDate ? new Date(row.startDate).getFullYear() : new Date().getFullYear(), description: row.description || "", coverUrl: row.coverUrl || "", isCurrent: false, location: row.location || "", modality: row.modality || "" }))))
      .catch((error: any) => toast.error(error?.message || "No se pudieron cargar las ediciones."))
      .finally(() => setIsLoadingEditions(false))
  }, [id])

  useSEO({
    title: event ? `${event.name} - Ediciones` : "Ediciones de Evento",
    description: `Historial y programación de las diferentes ediciones periódicas para el evento ${event?.name || ""}.`
  })

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isSingleDay, setIsSingleDay] = useState(false)
  const [isCurrent, setIsCurrent] = useState(false)
  const [location, setLocation] = useState("")
  const [modality, setModality] = useState("presencial")
  const suggestedModality = event?.eventMode === "ONLINE" ? "virtual" : event?.eventMode === "HYBRID" ? "hibrido" : event?.eventMode ? "presencial" : ""
  const applyEventSuggestions = () => {
    if (suggestedModality) setModality(suggestedModality)
    if (event?.venueAddress) setLocation(event.venueAddress)
  }

  const openCreate = () => {
    navigate(`/dashboard/events/${id}/editions/new`)
  }

  const openEdit = (ed: Edition) => {
    navigate(`/dashboard/events/${id}/editions/${ed.id}/edit`)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setName("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setIsSingleDay(false)
    setIsCurrent(false)
    setLocation("")
    setModality("presencial")
  }

  const editionSchema = z.object({
    name: z.string().trim().min(1, "El nombre de la edición es obligatorio."),
    startDate: z.string().min(1, "La fecha de inicio es requerida."),
    endDate: z.string(),
  }).refine((data) => isSingleDay || data.endDate.length > 0, { message: "La fecha de fin es requerida.", path: ["endDate"] })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = editionSchema.safeParse({
      name,
      startDate,
      endDate: isSingleDay ? "" : endDate,
    })

    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }
    if (editingId) {
      await updateEdition(editingId, { name, description, startDate, endDate: isSingleDay ? "" : endDate, isCurrent, location, modality })
    } else {
      await addEdition({
        mainEventId: id!,
        name,
        description,
        coverUrl: "",
        startDate,
        endDate: isSingleDay ? "" : endDate,
        isCurrent,
        location,
        modality,
      })
    }
    closeSheet()
  }

  const handleDelete = async (editionId: string) => {
    try {
      await deleteEdition(editionId)
      setRemoteEditions((items) => items.filter((item) => item.id !== editionId))
      toast.success("Edición eliminada con éxito.")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar la edición.")
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      header: "Portada",
      className: "p-3 w-20",
      headerClassName: "p-3 w-20",
      cell: (ed) => ed.coverUrl ? (
        <img src={ed.coverUrl} alt={`Portada de ${ed.name}`} className="h-10 w-16 rounded-md border border-border object-cover" />
      ) : (
        <div className="flex h-10 w-16 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">Sin imagen</div>
      ),
    },
    {
      header: "Nombre",
      className: "p-3 font-semibold",
      headerClassName: "p-3",
      cell: (ed) => (
        <>
          {ed.name}
          <p className="font-normal text-xs text-muted-foreground">
            {ed?.description || 'Sin descripcion'}
          </p>
        </>
      )
    },
    {
      header: "Fechas",
      className: "p-3 text-xs text-muted-foreground",
      headerClassName: "p-3",
      cell: (ed) => ed.startDate
        ? ed.endDate ? `${new Date(ed.startDate).toLocaleDateString("es-ES")} – ${new Date(ed.endDate).toLocaleDateString("es-ES")}` : new Date(ed.startDate).toLocaleDateString("es-ES")
        : "Por definir"
    },
    {
      header: "Modalidad",
      className: "p-3 text-xs capitalize text-muted-foreground",
      headerClassName: "p-3",
      cell: (ed) => ed.modality || "–"
    },
    {
      header: "Ubicación",
      className: "p-3 text-xs text-muted-foreground truncate max-w-[150px]",
      headerClassName: "p-3",
      cell: (ed) => ed.location || "–"
    },
    {
      header: "Estado",
      className: "p-3",
      headerClassName: "p-3",
      cell: (ed) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ed.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {ed.isCurrent ? "Actual" : "Planeado"}
        </span>
      )
    },
    {
      header: "Acciones",
      headerClassName: "text-right p-3",
      className: "text-right p-3",
      cell: (ed) => (
        <div className="flex items-center justify-end gap-1">
          <Button onClick={() => openEdit(ed)} variant="ghost" className="size-7 p-0">
            <Edit className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="size-7 p-0 text-destructive hover:bg-destructive/10">
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar edición?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará permanentemente "{ed.name}". Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(ed.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Ediciones"
        description="Historial y programación de las diferentes ediciones periódicas para el evento."
        actionButton={
          <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
            <Plus className="size-4 mr-1.5" />
            Nueva Edición
          </Button>
        }
      />

      {isLoadingEditions ? (
        <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">Cargando ediciones…</div>
      ) : eventEditions.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No hay ediciones programadas.
        </div>
      ) : (
        <DataTable columns={columns} data={eventEditions} containerClassName="border border-border rounded-xl" />
      )}

      {/* Sheet Create/Edit */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Edición" : "Nueva Edición"}</SheetTitle>
            <SheetDescription>Define los datos de la edición del evento.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 px-4 flex-1 overflow-y-auto pb-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edName">Nombre</FieldLabel>
                <Input id="edName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Edición 2025" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="edDesc">Descripción</FieldLabel>
                <textarea
                  id="edDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>
              <div className={`grid gap-4 ${isSingleDay ? "grid-cols-1" : "grid-cols-2"}`}>
                <Field>
                  <FieldLabel htmlFor="edStart">Fecha Inicio</FieldLabel>
                  <Input id="edStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                {!isSingleDay && <Field>
                  <FieldLabel htmlFor="edEnd">Fecha Fin</FieldLabel>
                  <Input id="edEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>}
              </div>
              <Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isSingleDay} onChange={(e) => setIsSingleDay(e.target.checked)} className="rounded border-input" />
                  <span className="text-sm font-medium">Full day (solo una fecha)</span>
                </label>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="edModality">Modalidad</FieldLabel>
                  <select
                    id="edModality"
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edLocation">Ubicación / Enlace</FieldLabel>
                  <Input
                    id="edLocation"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej. Hotel Savoy o Zoom Link"
                  />
                </Field>
              </div>
              {(suggestedModality || event?.venueAddress) && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <p>El evento general tiene configurada {suggestedModality ? `modalidad ${suggestedModality}` : ""}{suggestedModality && event?.venueAddress ? " y " : ""}{event?.venueAddress ? `ubicación ${event.venueAddress}` : ""}.</p>
                  <Button type="button" variant="link" className="h-auto px-0 py-1 text-xs" onClick={applyEventSuggestions}>Usar como sugerencia</Button>
                </div>
              )}
              <Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => setIsCurrent(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-medium">Edición actual</span>
                </label>
              </Field>
            </FieldGroup>
          </form>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={closeSheet}>Cancelar</Button>
            <Button onClick={handleSave} className="font-semibold">Guardar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
