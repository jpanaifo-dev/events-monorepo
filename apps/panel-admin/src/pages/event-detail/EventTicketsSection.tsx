import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { z } from "zod"
import { useEventStore, type EventTicket } from "@/store/event.store"
import { Plus, Trash2, Edit, Ticket, Calendar } from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
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

function formatToDatetimeLocal(isoString: string | null): string {
  if (!isoString) return ""
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ""
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ""
  }
}

export function EventTicketsSection() {
  const { id } = useParams<{ id: string }>()
  const { events, editions, tickets, loadTickets, addTicket, updateTicket, deleteTicket } = useEventStore()

  const event = events.find((e) => e.id === id)
  const eventEditions = editions.filter((ed) => ed.mainEventId === id)
  const currentEdition = eventEditions.find((ed) => ed.isCurrent)

  useSEO({
    title: event ? `${event.name} - Tickets y Costos` : "Tickets del Evento",
    description: `Configura los tipos de tickets, precios y capacidades para el evento ${event?.name || ""}.`
  })

  // Load tickets on mount or when id changes
  useEffect(() => {
    if (id) {
      loadTickets(id)
    }
  }, [id, loadTickets])

  // Filter states
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
  const [price, setPrice] = useState("0")
  const [currency, setCurrency] = useState("PEN")
  const [quantityTotal, setQuantityTotal] = useState("100")
  const [maxPerUser, setMaxPerUser] = useState("5")
  const [salesStartAt, setSalesStartAt] = useState("")
  const [salesEndAt, setSalesEndAt] = useState("")
  const [isEditionSpecific, setIsEditionSpecific] = useState(true)
  const [formEditionId, setFormEditionId] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  const [formError, setFormError] = useState("")

  // Sync default edition ID in form
  useEffect(() => {
    if (isEditionSpecific && currentEdition && !formEditionId) {
      setFormEditionId(currentEdition.id)
    }
  }, [isEditionSpecific, currentEdition, formEditionId])

  const openCreate = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setPrice("0")
    setCurrency("PEN")
    setQuantityTotal("100")
    setMaxPerUser("5")
    setSalesStartAt("")
    setSalesEndAt("")
    setIsEditionSpecific(true)
    setFormEditionId(currentEdition?.id || "")
    setIsActive(true)
    setFormError("")
    setIsSheetOpen(true)
  }

  const openEdit = (tk: EventTicket) => {
    setEditingId(tk.id)
    setName(tk.name)
    setDescription(tk.description || "")
    setPrice(String(tk.price))
    setCurrency(tk.currency || "USD")
    setQuantityTotal(String(tk.quantityTotal))
    setMaxPerUser(tk.maxPerUser ? String(tk.maxPerUser) : "")
    setSalesStartAt(formatToDatetimeLocal(tk.salesStartAt))
    setSalesEndAt(formatToDatetimeLocal(tk.salesEndAt))
    setIsEditionSpecific(!!tk.editionId)
    setFormEditionId(tk.editionId || currentEdition?.id || "")
    setIsActive(tk.isActive)
    setFormError("")
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setFormError("")
  }

  // Zod schema validation
  const ticketFormSchema = z.object({
    name: z.string().trim().min(1, "El nombre del ticket es obligatorio."),
    description: z.string().trim().optional(),
    price: z.preprocess(
      (val) => (val === "" ? 0 : Number(val)),
      z.number({ message: "El precio debe ser un número." }).min(0, "El precio no puede ser negativo.")
    ),
    currency: z.string().min(1, "La moneda es obligatoria."),
    quantityTotal: z.preprocess(
      (val) => (val === "" ? 0 : Number(val)),
      z.number({ message: "La cantidad debe ser un número entero." }).int().min(0, "La cantidad total debe ser mayor o igual a 0.")
    ),
    maxPerUser: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
      z.number().int().min(1, "El límite máximo por usuario debe ser al menos 1.").nullable()
    ).optional(),
    salesStartAt: z.string().nullable().optional(),
    salesEndAt: z.string().nullable().optional(),
    editionId: z.string().nullable(),
  }).refine((data) => {
    if (data.salesStartAt && data.salesEndAt) {
      return new Date(data.salesEndAt) >= new Date(data.salesStartAt)
    }
    return true
  }, {
    message: "La fecha de fin de ventas debe ser posterior o igual a la fecha de inicio.",
    path: ["salesEndAt"],
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    const targetEditionId = isEditionSpecific ? (formEditionId || null) : null
    const startIso = salesStartAt ? new Date(salesStartAt).toISOString() : null
    const endIso = salesEndAt ? new Date(salesEndAt).toISOString() : null

    const validation = ticketFormSchema.safeParse({
      name,
      description,
      price,
      currency,
      quantityTotal,
      maxPerUser: maxPerUser === "" ? null : maxPerUser,
      salesStartAt: salesStartAt || null,
      salesEndAt: salesEndAt || null,
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
      price: Number(price),
      currency,
      quantityTotal: Number(quantityTotal),
      maxPerUser: maxPerUser === "" ? null : Number(maxPerUser),
      salesStartAt: startIso,
      salesEndAt: endIso,
      isActive,
    }

    try {
      if (editingId) {
        await updateTicket(editingId, payload)
        toast.success("Ticket actualizado correctamente")
      } else {
        await addTicket(payload)
        toast.success("Ticket agregado correctamente")
      }
      closeSheet()
    } catch (err: any) {
      console.error(err)
      setFormError(err?.message || "Ocurrió un error al guardar el ticket.")
    }
  }

  const handleDelete = async (ticketId: string) => {
    try {
      await deleteTicket(ticketId)
      toast.success("Ticket eliminado correctamente")
    } catch (err: any) {
      console.error(err)
      toast.error("Ocurrió un error al eliminar el ticket")
    }
  }

  // Filter computed list
  const filteredTickets = tickets
    .filter((tk) => tk.mainEventId === id)
    .filter((tk) => {
      if (selectedEditionFilter === "all") return true
      if (selectedEditionFilter === "global") return tk.editionId === null
      return tk.editionId === selectedEditionFilter
    })

  const columns: ColumnDef<EventTicket>[] = [
    {
      header: "Nombre / Descripción",
      className: "max-w-sm p-3",
      headerClassName: "p-3",
      cell: (tk) => (
        <div className="flex items-start gap-3">
          <div className="size-7 rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
            <Ticket className="size-3.5" />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-sm leading-tight text-foreground">{tk.name}</p>
            {tk.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {tk.description}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      header: "Precio",
      className: "p-3",
      headerClassName: "p-3",
      cell: (tk) => {
        const isFree = tk.price === 0
        return (
          <div className="flex items-center gap-1 font-mono text-sm">
            <span className={isFree ? "font-semibold text-emerald-500" : "font-semibold text-foreground"}>
              {isFree ? "Gratis" : `${tk.price.toFixed(2)} ${tk.currency}`}
            </span>
          </div>
        )
      }
    },
    {
      header: "Capacidad",
      className: "p-3",
      headerClassName: "p-3",
      cell: (tk) => {
        const sold = tk.quantitySold || 0
        const total = tk.quantityTotal
        const percent = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0
        return (
          <div className="space-y-1.5 w-32">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>{sold} / {total}</span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      header: "Ventas",
      className: "p-3",
      headerClassName: "p-3",
      cell: (tk) => {
        if (!tk.salesStartAt && !tk.salesEndAt) {
          return <span className="text-xs text-muted-foreground">Siempre disponible</span>
        }
        const startStr = tk.salesStartAt ? new Date(tk.salesStartAt).toLocaleDateString() : "Inicio"
        const endStr = tk.salesEndAt ? new Date(tk.salesEndAt).toLocaleDateString() : "Fin"
        return (
          <div className="text-xs space-y-0.5 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground/70" />
              <span>{startStr} - {endStr}</span>
            </div>
          </div>
        )
      }
    },
    {
      header: "Ámbito",
      className: "p-3 text-xs",
      headerClassName: "p-3",
      cell: (tk) => {
        const isGlobal = !tk.editionId
        const targetEditionName = isGlobal
          ? ""
          : eventEditions.find((ed) => ed.id === tk.editionId)?.name || "Edición Desconocida"
        return isGlobal ? (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Global
          </Badge>
        ) : (
          <Badge variant="outline" className="border-primary/20 text-primary">
            Edición: {targetEditionName}
          </Badge>
        )
      }
    },
    {
      header: "Estado",
      className: "p-3 text-xs",
      headerClassName: "p-3",
      cell: (tk) => (
        <span className={`inline-flex items-center gap-1.5 font-semibold ${tk.isActive ? "text-emerald-500" : "text-muted-foreground"}`}>
          <span className={`size-1.5 rounded-full ${tk.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
          {tk.isActive ? "Activo" : "Inactivo"}
        </span>
      )
    },
    {
      header: "Acciones",
      headerClassName: "text-right p-3",
      className: "text-right p-3",
      cell: (tk) => (
        <div className="flex items-center justify-end gap-1">
          <Button onClick={() => openEdit(tk)} variant="ghost" className="size-7 p-0">
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
                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará el ticket "{tk.name}" de forma permanente del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(tk.id)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Tickets y Costos</h2>
          <p className="text-sm text-muted-foreground">Administra los tipos de entradas, precios y límites de venta.</p>
        </div>

        <Button onClick={openCreate} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus className="size-4" />
          Crear Ticket
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar por:</span>
        <Select value={selectedEditionFilter} onValueChange={setSelectedEditionFilter}>
          <SelectTrigger className="w-56 bg-card border-border">
            <SelectValue placeholder="Seleccionar Edición" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ediciones y globales</SelectItem>
            <SelectItem value="global">Solo Globales (Sin edición)</SelectItem>
            {eventEditions.map((ed) => (
              <SelectItem key={ed.id} value={ed.id}>
                Edición: {ed.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Datatable */}
      {filteredTickets.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <Ticket className="size-8 mx-auto opacity-40" />
          <div>
            <p className="font-semibold">No se encontraron tickets registrados</p>
            <p className="text-xs text-muted-foreground">
              {selectedEditionFilter === "all"
                ? "Comienza creando un ticket haciendo clic en el botón de arriba."
                : "No hay tickets registrados para este filtro. Crea uno o selecciona otro filtro."}
            </p>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredTickets} />
      )}

      {/* Sheet Form */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Ticket" : "Crear Nuevo Ticket"}</SheetTitle>
            <SheetDescription>
              Establece las reglas de precio, cantidad y fecha límite del ticket.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
            <FieldGroup>
              {/* Ticket Name */}
              <Field>
                <FieldLabel htmlFor="tkName">Nombre del Ticket</FieldLabel>
                <Input
                  id="tkName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. General, VIP, Early Bird"
                  required
                />
              </Field>

              {/* Ticket Description */}
              <Field>
                <FieldLabel htmlFor="tkDesc">Descripción</FieldLabel>
                <textarea
                  id="tkDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre lo que incluye la entrada..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground shadow-xs"
                />
              </Field>

              {/* Price & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="tkPrice">Precio</FieldLabel>
                  <div className="relative">
                    <Input
                      id="tkPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="tkCurrency">Moneda</FieldLabel>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="tkCurrency" className="bg-background border-border">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="PEN">PEN (S/.)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Capacities */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="tkTotal">Cantidad Total</FieldLabel>
                  <Input
                    id="tkTotal"
                    type="number"
                    min="0"
                    value={quantityTotal}
                    onChange={(e) => setQuantityTotal(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="tkMaxUser">Máx. por Usuario</FieldLabel>
                  <Input
                    id="tkMaxUser"
                    type="number"
                    min="1"
                    value={maxPerUser}
                    onChange={(e) => setMaxPerUser(e.target.value)}
                    placeholder="Ej. 5"
                  />
                </Field>
              </div>

              {/* Sales Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="tkStart">Inicio Ventas (Opcional)</FieldLabel>
                  <Input
                    id="tkStart"
                    type="datetime-local"
                    value={salesStartAt}
                    onChange={(e) => setSalesStartAt(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="tkEnd">Fin Ventas (Opcional)</FieldLabel>
                  <Input
                    id="tkEnd"
                    type="datetime-local"
                    value={salesEndAt}
                    onChange={(e) => setSalesEndAt(e.target.value)}
                  />
                </Field>
              </div>

              {/* Scope (Global vs Edition) */}
              <div className="flex flex-col gap-3 p-3 bg-muted/40 border border-border/80 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">Asignar a Edición Específica</span>
                    <p className="text-[10px] text-muted-foreground">Si se desactiva, el ticket será aplicable globalmente.</p>
                  </div>
                  <Switch checked={isEditionSpecific} onCheckedChange={setIsEditionSpecific} />
                </div>

                {isEditionSpecific && (
                  <Field className="pt-2">
                    <FieldLabel htmlFor="formEdition">Edición</FieldLabel>
                    <Select value={formEditionId} onValueChange={setFormEditionId}>
                      <SelectTrigger id="formEdition" className="bg-background border-border">
                        <SelectValue placeholder="Seleccionar Edición" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventEditions.map((ed) => (
                          <SelectItem key={ed.id} value={ed.id}>
                            {ed.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>

              {/* Activation Switch */}
              <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/80 rounded-lg">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">Ticket Activo</span>
                  <p className="text-[10px] text-muted-foreground">Permite o deshabilita la compra de este ticket.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </FieldGroup>

            {formError && (
              <p className="text-sm text-destructive font-medium mt-2">{formError}</p>
            )}

            <SheetFooter className="pt-4 border-t border-border gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeSheet} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {editingId ? "Guardar Cambios" : "Crear Ticket"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
