import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Plus, Edit, Trash2, Globe, Layers, BookOpen, Search, Loader2, UserCheck, Check, Download, Upload } from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

function parseCSV(text: string) {
  const lines: string[][] = []
  let row: string[] = [""]
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"'
        i++ // skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push("")
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++ // skip \n
      }
      lines.push(row)
      row = [""]
    } else {
      row[row.length - 1] += char
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row)
  }
  return lines
}
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
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
import { useDebouncedCallback } from "use-debounce"

import { useSEO } from "@/hooks/use-seo"

export function EventSpeakersSection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    events,
    speakers,
    roles,
    editions,
    deleteSpeaker,
    loadFilteredSpeakers,
    isLoading,
    toggleSpeakerCheckIn,
    bulkUpsertSpeakers,
  } = useEventStore()

  const event = events.find((e) => e.id === id)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === id)
  const eventEditions = editions.filter((ed) => ed.mainEventId === id)

  const searchQuery = searchParams.get("search") || ""
  const currentEdition = eventEditions.find((ed) => ed.isCurrent)
  const editionFilter = searchParams.get("edition") || currentEdition?.id || "all"

  const [localSearch, setLocalSearch] = useState(searchQuery)

  useSEO({
    title: event ? `${event.name} - Ponentes` : "Ponentes de Evento",
    description: `Listado de ponentes, expertos e invitados confirmados para el evento ${event?.name || ""}.`,
  })

  // Sync local search when search query changes externally (like clear all filters)
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Debounced search params updater
  const debouncedSearchUpdate = useDebouncedCallback((val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (val.trim()) {
        next.set("search", val.trim())
      } else {
        next.delete("search")
      }
      return next
    })
  }, 400)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalSearch(val)
    debouncedSearchUpdate(val)
  }

  const handleEditionChange = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (val) {
        next.set("edition", val)
      } else {
        next.delete("edition")
      }
      return next
    })
  }

  // Load/fetch speakers from the backend whenever search params change
  useEffect(() => {
    if (id) {
      loadFilteredSpeakers(id, {
        search: searchQuery,
        editionId: editionFilter,
      })
    }
  }, [id, searchQuery, editionFilter, loadFilteredSpeakers])

  const handleAddClick = () => {
    navigate(`/dashboard/events/${id}/speakers/new`)
  }

  const handleEditClick = (speakerId: string) => {
    navigate(`/dashboard/events/${id}/speakers/${speakerId}/edit`)
  }

  const [isImporting, setIsImporting] = useState(false)

  const handleExportTemplate = () => {
    const headers = [
      "ID",
      "Nombre",
      "Apellido",
      "Correo",
      "Charla",
      "Bio",
      "Rol",
      "Edicion"
    ]

    const escapeCSVField = (val: string | null | undefined): string => {
      if (val === null || val === undefined) return ""
      const stringVal = String(val)
      if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n") || stringVal.includes("\r")) {
        return `"${stringVal.replace(/"/g, '""')}"`
      }
      return stringVal
    }

    const csvRows = [headers.join(",")]

    eventSpeakers.forEach((sp) => {
      const roleObj = roles.find((r) => r.id === sp.roleId)
      const roleName = roleObj?.name.es || sp.roleSlug
      const editionName = editions.find((ed) => ed.id === sp.editionId)?.name || ""

      const row = [
        sp.id,
        sp.firstName,
        sp.lastName,
        sp.email || "",
        sp.talkTitle || "",
        sp.bio || "",
        roleName || "",
        editionName || ""
      ]
      csvRows.push(row.map(escapeCSVField).join(","))
    })

    if (eventSpeakers.length === 0) {
      const sampleRow = [
        "", // Leave blank for creation
        "Juan",
        "Pérez",
        "juan.perez@ejemplo.com",
        "Charla Magistral sobre IA",
        "Experto en aprendizaje profundo y desarrollo de agentes.",
        "Ponente",
        currentEdition?.name || ""
      ]
      csvRows.push(sampleRow.map(escapeCSVField).join(","))
    }

    const csvContent = "\uFEFF" + csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `plantilla_ponentes_${event?.slug || "evento"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Plantilla de ponentes exportada con éxito")
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setIsImporting(true)
    const reader = new FileReader()

    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (!text) {
        toast.error("El archivo está vacío o no se pudo leer.")
        setIsImporting(false)
        return
      }

      try {
        const parsed = parseCSV(text)
        if (parsed.length <= 1) {
          toast.error("El archivo CSV no contiene registros de datos.")
          setIsImporting(false)
          return
        }

        const headerRow = parsed[0].map(h => h.trim().toLowerCase())
        const idxId = headerRow.findIndex(h => h.includes("id"))
        const idxNombre = headerRow.findIndex(h => h.includes("nombre") || h.includes("first"))
        const idxApellido = headerRow.findIndex(h => h.includes("apellido") || h.includes("last"))
        const idxCorreo = headerRow.findIndex(h => h.includes("correo") || h.includes("email"))
        const idxCharla = headerRow.findIndex(h => h.includes("charla") || h.includes("titulo") || h.includes("título") || h.includes("ticket") || h.includes("charla"))
        const idxBio = headerRow.findIndex(h => h.includes("bio") || h.includes("biografía") || h.includes("biografia"))
        const idxRol = headerRow.findIndex(h => h.includes("rol") || h.includes("role"))
        const idxEdicion = headerRow.findIndex(h => h.includes("edicion") || h.includes("edición") || h.includes("edition"))

        if (idxNombre === -1 || idxApellido === -1) {
          toast.error("No se encontraron las columnas requeridas 'Nombre' y/o 'Apellido'.")
          setIsImporting(false)
          return
        }

        const rowsToImport = []
        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i]
          if (row.length === 0 || (row.length === 1 && row[0] === "")) continue

          const nombreVal = idxNombre !== -1 ? row[idxNombre]?.trim() : ""
          const apellidoVal = idxApellido !== -1 ? row[idxApellido]?.trim() : ""

          if (!nombreVal && !apellidoVal) continue

          const idVal = idxId !== -1 ? row[idxId]?.trim() : ""
          const correoVal = idxCorreo !== -1 ? row[idxCorreo]?.trim() : ""
          const charlaVal = idxCharla !== -1 ? row[idxCharla]?.trim() : ""
          const bioVal = idxBio !== -1 ? row[idxBio]?.trim() : ""
          const rolVal = idxRol !== -1 ? row[idxRol]?.trim() : ""
          const edicionVal = idxEdicion !== -1 ? row[idxEdicion]?.trim() : ""

          rowsToImport.push({
            id: idVal || undefined,
            firstName: nombreVal,
            lastName: apellidoVal,
            email: correoVal || null,
            talkTitle: charlaVal,
            bio: bioVal,
            roleName: rolVal,
            editionName: edicionVal
          })
        }

        if (rowsToImport.length === 0) {
          toast.error("No hay registros válidos para importar.")
          setIsImporting(false)
          return
        }

        toast.info(`Procesando la importación de ${rowsToImport.length} registros...`)

        const result = await bulkUpsertSpeakers(id, rowsToImport)

        if (result.errors.length > 0) {
          console.error("Errors during bulk import:", result.errors)
          toast.warning(
            `Importación completada con observaciones. Creados: ${result.createdCount}, Actualizados: ${result.updatedCount}. Hubo ${result.errors.length} errores. Revisa la consola.`
          )
        } else {
          toast.success(
            `Importación completada con éxito. Creados: ${result.createdCount}, Actualizados: ${result.updatedCount}.`
          )
        }
      } catch (err: any) {
        console.error("Failed to parse or import CSV:", err)
        toast.error(`Error al procesar el archivo: ${err.message || err}`)
      } finally {
        setIsImporting(false)
        e.target.value = ""
      }
    }

    reader.readAsText(file, "UTF-8")
  }

  const columns: ColumnDef<any>[] = [
    {
      header: "Ponente",
      className: "p-3",
      headerClassName: "p-3",
      cell: (sp) => sp ? (
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={sp.avatar}
              alt={sp.name}
              className="size-10 rounded-full border border-border/80 object-cover bg-muted shadow-xs"
            />
            {(!sp.email || !sp.identityDocumentNumber) && (
              <span
                className="absolute -top-0.5 -right-0.5 size-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-background shadow-xs select-none cursor-help animate-pulse"
                title={
                  !sp.email && !sp.identityDocumentNumber
                    ? "Falta registrar correo electrónico y número de documento"
                    : !sp.email
                      ? "Falta registrar correo electrónico"
                      : "Falta registrar número de documento"
                }
              >
                !
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-foreground truncate">{sp.name}</h4>
            {sp.email ? (
              <p className="text-xs text-muted-foreground truncate">{sp.email}</p>
            ) : (
              <p className="text-xs text-amber-500 italic truncate">Sin correo registrado</p>
            )}
          </div>
        </div>
      ) : null
    },
    {
      header: "Tipo de Ponente",
      className: "p-3",
      headerClassName: "p-3",
      cell: (sp) => {
        const roleObj = roles.find((r) => r.id === sp.roleId)
        const roleName = roleObj?.name.es || (sp.roleSlug === "keynote-speaker" ? "Ponente Magistral" : "Ponente")
        const badgeColor = roleObj?.badgeColor || "#3b82f6"
        const styleBadge = {
          backgroundColor: `${badgeColor}12`,
          color: badgeColor,
          borderColor: `${badgeColor}30`,
        }
        return (
          <div
            className="inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold font-sans tracking-wide uppercase"
            style={styleBadge}
          >
            {roleName}
          </div>
        )
      }
    },
    {
      header: "Biografía",
      className: "p-3 max-w-[320px]",
      headerClassName: "p-3",
      cell: (sp) => (
        <p className="text-xs text-muted-foreground leading-normal line-clamp-2" title={sp.bio}>
          {sp.bio || "Sin biografía registrada."}
        </p>
      )
    },
    {
      header: "Ámbito (Edición)",
      className: "p-3 text-xs",
      headerClassName: "p-3",
      cell: (sp) => {
        const isGlobal = !sp.editionId
        const editionName = isGlobal
          ? ""
          : editions.find((ed) => ed.id === sp.editionId)?.name || "Edición Desconocida"
        return isGlobal ? (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] gap-1 px-2 py-0.5">
            <Globe className="size-3" />
            Global
          </Badge>
        ) : (
          <Badge variant="outline" className="border-primary/20 text-primary text-[10px] gap-1 px-2 py-0.5">
            <Layers className="size-3" />
            {editionName}
          </Badge>
        )
      }
    },
    {
      header: "Check-In",
      className: "p-3 text-center",
      headerClassName: "p-3 text-center",
      cell: (sp) => (
        <button
          onClick={() => toggleSpeakerCheckIn(sp.id)}
          className={`p-1.5 rounded-full border transition-colors inline-flex ${sp.checkedIn ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/40 border-border/80 text-muted-foreground/60 hover:text-foreground"}`}
          title={sp.checkedIn ? "Acreditado (Haga clic para desmarcar)" : "Sin Acreditar (Haga clic para marcar)"}
        >
          {sp.checkedIn ? <UserCheck className="size-4" /> : <Check className="size-4" />}
        </button>
      )
    },
    {
      header: "Acciones",
      headerClassName: "text-right p-3",
      className: "text-right p-3",
      cell: (sp) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            onClick={() => handleEditClick(sp.id)}
            variant="ghost"
            className="size-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Edit className="size-3.5" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="size-8 p-0 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar ponente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará permanentemente a "{sp.name}" y se removerá su vinculación del evento. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSpeaker(sp.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
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

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-lg font-bold">Ponentes</h3>
          <p className="text-xs text-muted-foreground">
            Gestiona los expositores de charlas, conferencias y talleres.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportTemplate}
            variant="outline"
            className="text-xs px-3 py-1.5 h-8 flex items-center gap-1.5 transition-all hover:bg-muted"
            title="Exportar plantilla CSV con los ponentes actuales"
          >
            <Download className="size-4" />
            <span className="hidden md:inline">Exportar Plantilla</span>
          </Button>

          <label
            className={`cursor-pointer inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-semibold px-3 py-1.5 h-8 gap-1.5 transition-colors shadow-xs ${isImporting ? "opacity-50 pointer-events-none" : ""}`}
            title="Importar ponentes desde archivo CSV"
          >
            {isImporting ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <Upload className="size-4" />
            )}
            <span className="hidden md:inline">{isImporting ? "Importando..." : "Importar CSV"}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
              disabled={isImporting}
            />
          </label>

          <Button onClick={handleAddClick} className="text-xs px-3 py-1.5 h-8">
            <Plus className="size-4 mr-1.5" />
            Agregar Ponente
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-xs rounded-xl shadow-xs border-muted-foreground/20 focus-visible:ring-primary/20"
          />
        </div>

        {/* Edition Select Filter */}
        <div className="w-full sm:max-w-xs">
          <Select value={editionFilter} onValueChange={handleEditionChange}>
            <SelectTrigger className="h-9 text-xs rounded-xl shadow-xs border-muted-foreground/20">
              <SelectValue placeholder="Todas las ediciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ediciones</SelectItem>
              {eventEditions.map((ed) => (
                <SelectItem key={ed.id} value={ed.id}>
                  {`${ed.name} (${ed.year})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading Spinner for dynamic backend loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span>Actualizando...</span>
          </div>
        )}
      </div>

      {/* Speakers List */}
      {eventSpeakers.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/10 space-y-3">
          <BookOpen className="size-8 mx-auto opacity-40 text-primary animate-pulse" />
          <div>
            <p className="font-semibold">
              {searchQuery || editionFilter !== "all"
                ? "No se encontraron ponentes"
                : "No hay ponentes registrados"}
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery || editionFilter !== "all"
                ? "Prueba a cambiar los filtros o el término de búsqueda."
                : 'Haz clic en "Agregar Ponente" para registrar al primer conferencista.'}
            </p>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={eventSpeakers} />
      )}
    </div>
  )
}
