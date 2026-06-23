import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import {
  Download,
  Upload,
  Check,
  AlertCircle,
  X,
  Loader2,
  UserPlus,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react"

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

interface ParsedRow {
  id?: string
  firstName: string
  lastName: string
  email: string | null
  identityDocumentType?: string | null
  identityDocumentNumber?: string | null
  talkTitle: string
  bio: string
  roleName: string
  editionName: string
  isUpdate: boolean
  matchedSpeakerName?: string
  isValid: boolean
  errorReason?: string
}

export function EventSpeakersImportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    events,
    speakers,
    roles,
    editions,
    loadFilteredSpeakers,
    bulkUpsertSpeakers
  } = useEventStore()

  const event = events.find((e) => e.id === id)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === id)
  const eventEditions = editions.filter((ed) => ed.mainEventId === id)
  const currentEdition = eventEditions.find((ed) => ed.isCurrent)

  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Ensure speakers and roles are loaded for matching
  useEffect(() => {
    if (id) {
      loadFilteredSpeakers(id, { page: 1, pageSize: 100 })
    }
  }, [id, loadFilteredSpeakers])

  const handleExportTemplate = () => {
    const headers = [
      "ID",
      "Nombre",
      "Apellido",
      "Correo",
      "Tipo Documento",
      "Nro Documento",
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
        sp.identityDocumentType || "",
        sp.identityDocumentNumber || "",
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
        "DNI", // Tipo Documento
        "12345678", // Nro Documento
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

  const processFile = (selectedFile: File) => {
    setFile(selectedFile)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        toast.error("El archivo está vacío o no se pudo leer.")
        return
      }

      try {
        const parsed = parseCSV(text)
        if (parsed.length <= 1) {
          toast.error("El archivo CSV no contiene registros de datos.")
          return
        }

        const headerRow = parsed[0].map(h => h.trim().toLowerCase())
        const idxId = headerRow.findIndex(h => h.includes("id"))
        const idxNombre = headerRow.findIndex(h => h.includes("nombre") || h.includes("first"))
        const idxApellido = headerRow.findIndex(h => h.includes("apellido") || h.includes("last"))
        const idxCorreo = headerRow.findIndex(h => h.includes("correo") || h.includes("email"))
        const idxTipoDoc = headerRow.findIndex(h => h.includes("tipo") || h.includes("type"))
        const idxNroDoc = headerRow.findIndex(h =>
          h.includes("nro") ||
          h.includes("numero") ||
          h.includes("número") ||
          h.includes("dni") ||
          h.includes("ruc") ||
          h.includes("number") ||
          (h.includes("documento") && !h.includes("tipo"))
        )
        const idxCharla = headerRow.findIndex(h => h.includes("charla") || h.includes("titulo") || h.includes("título") || h.includes("ticket") || h.includes("charla"))
        const idxBio = headerRow.findIndex(h => h.includes("bio") || h.includes("biografía") || h.includes("biografia"))
        const idxRol = headerRow.findIndex(h => h.includes("rol") || h.includes("role"))
        const idxEdicion = headerRow.findIndex(h => h.includes("edicion") || h.includes("edición") || h.includes("edition"))

        if (idxNombre === -1 || idxApellido === -1) {
          toast.error("No se encontraron las columnas requeridas 'Nombre' y/o 'Apellido'.")
          return
        }

        const tempRows: ParsedRow[] = []

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i]
          if (row.length === 0 || (row.length === 1 && row[0] === "")) continue

          const nombreVal = idxNombre !== -1 ? row[idxNombre]?.trim() : ""
          const apellidoVal = idxApellido !== -1 ? row[idxApellido]?.trim() : ""

          if (!nombreVal && !apellidoVal) continue

          const idVal = idxId !== -1 ? row[idxId]?.trim() : ""
          const correoVal = idxCorreo !== -1 ? row[idxCorreo]?.trim() : ""
          const tipoDocVal = idxTipoDoc !== -1 ? row[idxTipoDoc]?.trim()?.toUpperCase() : ""
          const nroDocVal = idxNroDoc !== -1 ? row[idxNroDoc]?.trim() : ""
          const charlaVal = idxCharla !== -1 ? row[idxCharla]?.trim() : ""
          const bioVal = idxBio !== -1 ? row[idxBio]?.trim() : ""
          const rolVal = idxRol !== -1 ? row[idxRol]?.trim() : ""
          const edicionVal = idxEdicion !== -1 ? row[idxEdicion]?.trim() : ""

          // Determine validation
          let rowIsValid = !!nombreVal && !!apellidoVal
          let rowError = rowIsValid ? undefined : "Nombre y Apellido son obligatorios"

          if (rowIsValid && tipoDocVal) {
            const allowedTypes = ["DNI", "RUC", "OTRO"]
            if (!allowedTypes.includes(tipoDocVal)) {
              rowIsValid = false
              rowError = "El tipo de documento debe ser DNI, RUC u OTRO"
            } else if (!nroDocVal) {
              rowIsValid = false
              rowError = "El número de documento es requerido si se especifica el tipo"
            }
          } else if (rowIsValid && nroDocVal && !tipoDocVal) {
            rowIsValid = false
            rowError = "El tipo de documento es requerido si se especifica el número"
          }

          // Check if exists
          let existingSpeaker = null
          if (idVal) {
            existingSpeaker = eventSpeakers.find(s => s.id === idVal)
          }
          if (!existingSpeaker && correoVal) {
            existingSpeaker = eventSpeakers.find(s => s.email?.toLowerCase() === correoVal.toLowerCase())
          }

          tempRows.push({
            id: idVal || undefined,
            firstName: nombreVal,
            lastName: apellidoVal,
            email: correoVal || null,
            identityDocumentType: tipoDocVal || null,
            identityDocumentNumber: nroDocVal || null,
            talkTitle: charlaVal,
            bio: bioVal,
            roleName: rolVal,
            editionName: edicionVal,
            isUpdate: !!existingSpeaker,
            matchedSpeakerName: existingSpeaker ? existingSpeaker.name : undefined,
            isValid: rowIsValid,
            errorReason: rowError
          })
        }

        setParsedRows(tempRows)
      } catch (err: any) {
        console.error("Error parsing CSV:", err)
        toast.error(`Error al procesar el archivo CSV: ${err.message || err}`)
      }
    }

    reader.readAsText(selectedFile, "UTF-8")
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith(".csv")) {
        processFile(droppedFile)
      } else {
        toast.error("Por favor suba únicamente archivos en formato .csv")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleConfirmImport = async () => {
    if (!id || parsedRows.length === 0) return

    setIsImporting(true)
    try {
      const validRows = parsedRows.filter(r => r.isValid)
      if (validRows.length === 0) {
        toast.error("No hay registros válidos para importar.")
        setIsImporting(false)
        return
      }

      const rowsToImport = validRows.map(r => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        talkTitle: r.talkTitle,
        bio: r.bio,
        roleName: r.roleName,
        editionName: r.editionName,
        identityDocumentType: r.identityDocumentType,
        identityDocumentNumber: r.identityDocumentNumber
      }))

      const result = await bulkUpsertSpeakers(id, rowsToImport)

      if (result.errors.length > 0) {
        console.error("Errors during bulk import:", result.errors)
        toast.warning(
          `Importación completada con observaciones. Creados: ${result.createdCount}, Actualizados: ${result.updatedCount}. Hubo ${result.errors.length} errores. Revisa la consola.`
        )
      } else {
        toast.success(
          `Importación completada con éxito. Creados: ${result.createdCount}, Actualizados: ${result.updatedCount} ponentes.`
        )
      }
      navigate(`/dashboard/events/${id}/speakers`)
    } catch (err: any) {
      console.error(err)
      toast.error(`Error al procesar la carga masiva: ${err.message || err}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelPreview = () => {
    setFile(null)
    setParsedRows([])
  }

  const countCreates = parsedRows.filter(r => r.isValid && !r.isUpdate).length
  const countUpdates = parsedRows.filter(r => r.isValid && r.isUpdate).length
  const countInvalids = parsedRows.filter(r => !r.isValid).length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Importar Ponentes en Bloque"
        description={event.name}
        showBackButton
        onBackClick={() => navigate(`/dashboard/events/${id}/speakers`)}
      />

      {!file ? (
        // Paso 1: Subir Archivo
        <div className="flex flex-col gap-6">

          {/* Instrucciones */}
          <div className="space-y-4 border border-border rounded-xl bg-card/10 p-6">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="size-4 text-primary shrink-0" />
              <span>Instrucciones de Carga</span>
            </h4>
            <ul className="text-xs text-muted-foreground space-y-3 list-disc pl-4 leading-relaxed">
              <li>Usa un archivo formateado en <strong>CSV</strong> delimitado por comas.</li>
              <li>Las columnas requeridas obligatoriamente son <strong>Nombre</strong> y <strong>Apellido</strong>.</li>
              <li>Si completas la columna <strong>ID</strong> o colocas un <strong>Correo</strong> que ya está registrado, el sistema <strong>actualizará</strong> los datos del ponente correspondiente.</li>
              <li>Si dejas la columna <strong>ID</strong> vacía y el correo es nuevo, se <strong>creará</strong> un ponente nuevo.</li>
              <li>Las columnas <strong>Rol</strong> y <strong>Edición</strong> son opcionales; si no coinciden, se usará el valor predeterminado del evento.</li>
            </ul>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTemplate}
                className="w-full sm:w-auto text-xs font-semibold flex items-center gap-1.5 justify-center"
              >
                <Download className="size-4" />
                Descargar Plantilla CSV
              </Button>
            </div>
          </div>

          {/* Area de Arrastre/Seleccion de Archivo */}
          <div className="w-full">
            <form
              onDragEnter={handleDrag}
              onSubmit={(e) => e.preventDefault()}
              className="w-full"
            >
              <div
                className={`min-h-[220px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all ${dragActive
                  ? "border-primary bg-primary/[0.02]"
                  : "border-border hover:border-primary/50 bg-card/5"
                  }`}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="p-4 bg-muted/50 rounded-full text-muted-foreground mb-4">
                  <Upload className="size-8" />
                </div>
                <h3 className="font-bold text-base mb-1">Arrastra tu archivo aquí</h3>
                <p className="text-xs text-muted-foreground max-w-xs mb-6">
                  Sube únicamente archivos <strong>.csv</strong> delimitados por comas (UTF-8).
                </p>

                <label className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 h-9 transition-colors shadow-xs hover:bg-primary/95">
                  <span>Seleccionar Archivo</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </form>
          </div>

        </div>
      ) : (
        // Paso 2: Vista Previa y Confirmacion
        <div className="space-y-6">

          {/* Summary Card */}
          <div className="border border-border rounded-xl bg-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <FileSpreadsheet className="size-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm truncate max-w-xs md:max-w-md">{file.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} registros cargados
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full font-semibold">
                <UserPlus className="size-3.5" />
                <span>{countCreates} por crear</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full font-semibold">
                <RefreshCw className="size-3.5" />
                <span>{countUpdates} por actualizar</span>
              </div>
              {countInvalids > 0 && (
                <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-semibold">
                  <AlertCircle className="size-3.5" />
                  <span>{countInvalids} inválidos (se omitirán)</span>
                </div>
              )}
            </div>
          </div>

          {/* Table Preview */}
          <div className="border border-border rounded-xl overflow-hidden bg-card/5">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 sticky top-0 uppercase font-bold text-muted-foreground border-b border-border text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo</th>
                    <th className="p-3">Tipo Doc</th>
                    <th className="p-3">Nro Doc</th>
                    <th className="p-3">Charla</th>
                    <th className="p-3">Bio</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Edición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {parsedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-muted/5 ${!row.isValid ? "bg-destructive/[0.02]" : ""}`}
                    >
                      <td className="p-3 whitespace-nowrap">
                        {!row.isValid ? (
                          <span
                            className="inline-flex items-center gap-1 text-destructive font-bold cursor-help"
                            title={row.errorReason}
                          >
                            <AlertCircle className="size-3" />
                            Inválido
                          </span>
                        ) : row.isUpdate ? (
                          <span
                            className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-bold uppercase text-[9px] border border-blue-500/20"
                            title={`Modificará a: ${row.matchedSpeakerName}`}
                          >
                            <RefreshCw className="size-2.5" />
                            Actualizar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase text-[9px] border border-emerald-500/20">
                            <UserPlus className="size-2.5" />
                            Crear
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        <div>{row.firstName} {row.lastName}</div>
                        {!row.isValid && row.errorReason && (
                          <div className="text-[10px] text-destructive font-normal mt-0.5 leading-tight">{row.errorReason}</div>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground truncate max-w-[150px]">
                        {row.email || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {row.identityDocumentType || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {row.identityDocumentNumber || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground truncate max-w-[150px]">
                        {row.talkTitle || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground truncate max-w-[200px]" title={row.bio}>
                        {row.bio || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {row.roleName || <span className="italic opacity-60">Por defecto</span>}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {row.editionName || <span className="italic opacity-60">Por defecto</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancelPreview}
              disabled={isImporting}
              className="text-xs h-9 px-4 flex items-center gap-1.5 transition-colors"
            >
              <X className="size-4" />
              Cancelar y Cambiar Archivo
            </Button>

            <Button
              onClick={handleConfirmImport}
              disabled={isImporting || (countCreates === 0 && countUpdates === 0)}
              className="text-xs h-9 px-5 flex items-center gap-1.5 transition-colors"
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Procesando Importación...</span>
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  <span>Confirmar e Importar ({countCreates + countUpdates})</span>
                </>
              )}
            </Button>
          </div>

        </div>
      )}

    </div>
  )
}
