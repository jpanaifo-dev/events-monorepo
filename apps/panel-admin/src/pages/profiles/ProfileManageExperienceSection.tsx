import { useState } from "react"
import { useParams } from "react-router-dom"
import { z } from "zod"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import type { EmploymentHistory } from "@/store/profile.store"
import { Plus, Trash2, Edit, Briefcase, Calendar, MapPin, Globe } from "lucide-react"
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

export function ProfileManageExperienceSection() {
  const { profileId } = useParams<{ profileId: string }>()
  const { selectedProfileEmployment, addEmploymentHistory, updateEmploymentHistory, deleteEmploymentHistory, profiles } = useAdminProfilesStore()
  const targetProfile = profiles.find((p) => p.id === profileId)

  useSEO({
    title: targetProfile ? `Experiencia de ${targetProfile.firstName}` : "Gestionar Experiencia",
    description: "Administra el historial laboral y cargos del usuario."
  })

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form fields
  const [organization, setOrganization] = useState("")
  const [role, setRole] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isCurrent, setIsCurrent] = useState(false)
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [visibility, setVisibility] = useState("public")
  const [isFavorite, setIsFavorite] = useState(false)
  const [formError, setFormError] = useState("")

  const openCreate = () => {
    setEditingId(null)
    setOrganization("")
    setRole("")
    setStartDate("")
    setEndDate("")
    setIsCurrent(false)
    setCity("")
    setCountry("")
    setVisibility("public")
    setIsFavorite(false)
    setFormError("")
    setIsSheetOpen(true)
  }

  const openEdit = (item: EmploymentHistory) => {
    setEditingId(item.id)
    setOrganization(item.organization)
    setRole(item.role)
    setStartDate(item.startDate)
    setEndDate(item.endDate || "")
    setIsCurrent(item.isCurrent)
    setCity(item.city || "")
    setCountry(item.country || "")
    setVisibility(item.visibility)
    setIsFavorite(item.isFavorite)
    setFormError("")
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setFormError("")
  }

  const experienceSchema = z.object({
    organization: z.string().trim().min(1, "El nombre de la empresa u organización es requerido."),
    role: z.string().trim().min(1, "El cargo o rol es requerido."),
    startDate: z.string().min(1, "La fecha de inicio es requerida."),
    endDate: z.string().optional().nullable(),
    isCurrent: z.boolean(),
    city: z.string().trim().optional().nullable(),
    country: z.string().trim().optional().nullable(),
    visibility: z.string(),
    isFavorite: z.boolean(),
  }).refine((data) => {
    if (!data.isCurrent && !data.endDate) {
      return false
    }
    return true
  }, {
    message: "La fecha de finalización es obligatoria si no es tu trabajo actual.",
    path: ["endDate"]
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId) return
    setFormError("")

    const validation = experienceSchema.safeParse({
      organization,
      role,
      startDate,
      endDate: isCurrent ? null : (endDate || null),
      isCurrent,
      city: city || null,
      country: country || null,
      visibility,
      isFavorite,
    })

    if (!validation.success) {
      setFormError(validation.error.issues[0].message)
      return
    }

    const payload = {
      organization: organization.trim(),
      role: role.trim(),
      startDate,
      endDate: isCurrent ? null : (endDate || null),
      isCurrent,
      city: city.trim() || null,
      country: country.trim() || null,
      visibility,
      isFavorite,
    }

    try {
      if (editingId) {
        await updateEmploymentHistory(editingId, payload)
        toast.success("Experiencia laboral actualizada")
      } else {
        await addEmploymentHistory(profileId, payload)
        toast.success("Experiencia laboral agregada")
      }
      closeSheet()
    } catch (err: any) {
      console.error(err)
      setFormError(err?.message || "Ocurrió un error al guardar.")
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await deleteEmploymentHistory(itemId)
      toast.success("Experiencia laboral eliminada")
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar la experiencia")
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    const [year, month] = dateStr.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title & Add Button */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-lg font-bold">Experiencia Profesional</h3>
          <p className="text-xs text-muted-foreground">
            Historial de empleo del usuario en la plataforma.
          </p>
        </div>
        <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Añadir Experiencia
        </Button>
      </div>

      {/* Experience list */}
      {selectedProfileEmployment.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <Briefcase className="size-8 mx-auto opacity-40" />
          <div>
            <p className="font-semibold">No hay experiencia profesional registrada</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {selectedProfileEmployment.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-border bg-card hover:bg-muted/5 transition-all duration-300 relative overflow-hidden group flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center text-muted-foreground">
                  <Briefcase className="size-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">{item.role}</h4>
                    <span className="text-muted-foreground text-xs">en</span>
                    <span className="font-semibold text-sm text-primary">{item.organization}</span>
                    {item.isFavorite && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                        Destacado
                      </Badge>
                    )}
                  </div>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {formatDate(item.startDate)} – {item.isCurrent ? "Actualidad" : formatDate(item.endDate)}
                    </span>
                    {(item.city || item.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {[item.city, item.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Globe className="size-3.5" />
                      {item.visibility === "public" ? "Público" : "Privado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 md:self-start self-end">
                <Button onClick={() => openEdit(item)} variant="ghost" className="size-8 p-0">
                  <Edit className="size-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0 text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar experiencia?</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas eliminar este cargo de "{item.role}" en "{item.organization}"? Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(item.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet Form */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Experiencia" : "Añadir Experiencia"}</SheetTitle>
            <SheetDescription>
              Completa los detalles del cargo profesional. Los campos con * son obligatorios.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-5 px-4 mt-6 flex-1 overflow-y-auto pb-6">
            
            {formError && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium">
                {formError}
              </div>
            )}

            <FieldGroup>
              
              {/* Organization */}
              <Field>
                <FieldLabel htmlFor="orgName">Empresa / Organización *</FieldLabel>
                <Input
                  id="orgName"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Ej. Google, Universidad Nacional"
                  required
                />
              </Field>

              {/* Role */}
              <Field>
                <FieldLabel htmlFor="jobRole">Cargo / Rol *</FieldLabel>
                <Input
                  id="jobRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ej. Desarrollador Senior, Docente"
                  required
                />
              </Field>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="startDt">Fecha Inicio *</FieldLabel>
                  <Input
                    id="startDt"
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </Field>
                {!isCurrent && (
                  <Field>
                    <FieldLabel htmlFor="endDt">Fecha Fin *</FieldLabel>
                    <Input
                      id="endDt"
                      type="month"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required={!isCurrent}
                    />
                  </Field>
                )}
              </div>

              {/* Is Current Checkbox */}
              <div className="flex items-center justify-between p-1 bg-muted/10 border border-border/50 rounded-xl px-4 py-3">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="currJob">
                    Trabajo aquí actualmente
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Marcar si este es su empleo actual.
                  </p>
                </div>
                <Switch
                  id="currJob"
                  checked={isCurrent}
                  onCheckedChange={setIsCurrent}
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="jobCity">Ciudad</FieldLabel>
                  <Input
                    id="jobCity"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Lima"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="jobCountry">País</FieldLabel>
                  <Input
                    id="jobCountry"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ej. Perú"
                  />
                </Field>
              </div>

              {/* Visibility Selector */}
              <Field>
                <FieldLabel htmlFor="jobVis">Visibilidad en el perfil</FieldLabel>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="jobVis">
                    <SelectValue placeholder="Selecciona visibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público (Visible para todos)</SelectItem>
                    <SelectItem value="private">Privado (Solo organizadores)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Is Favorite Switch */}
              <div className="flex items-center justify-between p-1">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="favJob">
                    Destacar experiencia
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Aparecerá resaltado al inicio de la biografía.
                  </p>
                </div>
                <Switch
                  id="favJob"
                  checked={isFavorite}
                  onCheckedChange={setIsFavorite}
                />
              </div>

            </FieldGroup>
          </form>

          <SheetFooter className="mt-8 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={closeSheet}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="font-semibold">
              {editingId ? "Guardar Cambios" : "Añadir Experiencia"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
