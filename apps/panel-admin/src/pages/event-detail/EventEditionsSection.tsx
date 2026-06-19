import { useState } from "react"
import { useParams } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import type { Edition } from "@/store/event.store"
import { Plus, Edit2, Trash2 } from "lucide-react"
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

export function EventEditionsSection() {
  const { id } = useParams<{ id: string }>()
  const { editions, addEdition, updateEdition, deleteEdition } = useEventStore()

  const eventEditions = editions.filter((ed) => ed.mainEventId === id)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isCurrent, setIsCurrent] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setIsCurrent(false)
    setIsSheetOpen(true)
  }

  const openEdit = (ed: Edition) => {
    setEditingId(ed.id)
    setName(ed.name)
    setDescription(ed.description)
    setStartDate(ed.startDate)
    setEndDate(ed.endDate)
    setIsCurrent(ed.isCurrent)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setName("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setIsCurrent(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateEdition(editingId, { name, description, startDate, endDate, isCurrent })
    } else {
      await addEdition({
        mainEventId: id!,
        name,
        description,
        startDate,
        endDate,
        isCurrent,
      })
    }
    closeSheet()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-lg font-bold">Ediciones</h3>
        <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Nueva Edición
        </Button>
      </div>

      {eventEditions.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No hay ediciones programadas.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/60 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                <th className="p-3">Nombre</th>
                <th className="p-3">Fechas</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {eventEditions.map((ed) => (
                <tr key={ed.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold">{ed.name}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {ed.startDate && ed.endDate
                      ? `${new Date(ed.startDate).toLocaleDateString("es-ES")} – ${new Date(ed.endDate).toLocaleDateString("es-ES")}`
                      : "Por definir"}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ed.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {ed.isCurrent ? "Actual" : "Planeado"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button onClick={() => openEdit(ed)} variant="ghost" className="size-7 p-0">
                        <Edit2 className="size-3.5" />
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
                            <AlertDialogAction onClick={() => deleteEdition(ed.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Sí, eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sheet Create/Edit */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Edición" : "Nueva Edición"}</SheetTitle>
            <SheetDescription>Define los datos de la edición del evento.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 px-4">
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
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="edStart">Fecha Inicio</FieldLabel>
                  <Input id="edStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edEnd">Fecha Fin</FieldLabel>
                  <Input id="edEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
              </div>
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
