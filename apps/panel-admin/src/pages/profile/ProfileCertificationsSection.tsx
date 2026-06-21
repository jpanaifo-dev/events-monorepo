import { useState } from "react"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { useProfileStore, type Certification } from "@/store/profile.store"
import { Plus, Trash2, Edit, Award, Calendar, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
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

export function ProfileCertificationsSection() {
  const { user } = useAuthStore()
  const { certifications, addCertification, updateCertification, deleteCertification } = useProfileStore()

  useSEO({
    title: "Mi Perfil - Certificaciones",
    description: "Administra tus certificaciones, credenciales de aptitud, licencias y diplomas en EventHive."
  })

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [issuingOrganization, setIssuingOrganization] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [credentialId, setCredentialId] = useState("")
  const [credentialUrl, setCredentialUrl] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [formError, setFormError] = useState("")

  const openCreate = () => {
    setEditingId(null)
    setName("")
    setIssuingOrganization("")
    setIssueDate("")
    setExpirationDate("")
    setCredentialId("")
    setCredentialUrl("")
    setIsFavorite(false)
    setFormError("")
    setIsSheetOpen(true)
  }

  const openEdit = (item: Certification) => {
    setEditingId(item.id)
    setName(item.name)
    setIssuingOrganization(item.issuingOrganization)
    setIssueDate(item.issueDate)
    setExpirationDate(item.expirationDate || "")
    setCredentialId(item.credentialId || "")
    setCredentialUrl(item.credentialUrl || "")
    setIsFavorite(item.isFavorite)
    setFormError("")
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setFormError("")
  }

  const certificationSchema = z.object({
    name: z.string().trim().min(1, "El nombre de la certificación es requerido."),
    issuingOrganization: z.string().trim().min(1, "La organización emisora es requerida."),
    issueDate: z.string().min(1, "La fecha de expedición es obligatoria."),
    expirationDate: z.string().optional().nullable(),
    credentialId: z.string().trim().optional().nullable(),
    credentialUrl: z.string().trim().url("El enlace de la credencial debe ser una URL válida.").or(z.literal("")).optional().nullable(),
    isFavorite: z.boolean(),
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setFormError("")

    const validation = certificationSchema.safeParse({
      name,
      issuingOrganization,
      issueDate,
      expirationDate: expirationDate || null,
      credentialId: credentialId || null,
      credentialUrl: credentialUrl || null,
      isFavorite,
    })

    if (!validation.success) {
      setFormError(validation.error.issues[0].message)
      return
    }

    const payload = {
      name: name.trim(),
      issuingOrganization: issuingOrganization.trim(),
      issueDate,
      expirationDate: expirationDate || null,
      credentialId: credentialId.trim() || null,
      credentialUrl: credentialUrl.trim() || null,
      isFavorite,
    }

    try {
      if (editingId) {
        await updateCertification(editingId, payload)
        toast.success("Certificación actualizada correctamente")
      } else {
        await addCertification(user.id, payload)
        toast.success("Certificación agregada correctamente")
      }
      closeSheet()
    } catch (err: any) {
      console.error(err)
      setFormError(err?.message || "Ocurrió un error al guardar.")
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await deleteCertification(itemId)
      toast.success("Certificación eliminada")
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar la certificación")
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    
    if (year && month && day) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    } else if (year && month) {
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    }
    return dateStr
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title & Add Button */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-lg font-bold">Certificaciones y Diplomas</h3>
          <p className="text-xs text-muted-foreground">
            Añade tus certificaciones, licencias o acreditaciones para respaldar tu perfil.
          </p>
        </div>
        <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Añadir Certificación
        </Button>
      </div>

      {/* Certifications list */}
      {certifications.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <Award className="size-8 mx-auto opacity-40" />
          <div>
            <p className="font-semibold">No hay certificaciones registradas</p>
            <p className="text-xs text-muted-foreground">
              Comienza añadiendo tus certificados haciendo clic en el botón de arriba.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {certifications.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-border bg-card hover:bg-muted/5 transition-all duration-300 relative overflow-hidden group flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center text-muted-foreground">
                  <Award className="size-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <span className="text-muted-foreground text-xs">de</span>
                    <span className="font-semibold text-sm text-primary">{item.issuingOrganization}</span>
                    {item.isFavorite && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                        Destacado
                      </Badge>
                    )}
                  </div>
                  
                  {/* Metadata Info Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      Expedido: {formatDate(item.issueDate)} {item.expirationDate ? `– Vence: ${formatDate(item.expirationDate)}` : "– Sin fecha de vencimiento"}
                    </span>
                    {item.credentialId && (
                      <span>ID de credencial: <code className="text-xs bg-muted/30 px-1 py-0.5 rounded border border-border/40 font-mono">{item.credentialId}</code></span>
                    )}
                    {item.credentialUrl && (
                      <a
                        href={item.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Link className="size-3" />
                        Ver credencial
                      </a>
                    )}
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
                      <AlertDialogTitle>¿Eliminar certificación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas eliminar la certificación "{item.name}"? Esta acción no se puede deshacer.
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
            <SheetTitle>{editingId ? "Editar Certificación" : "Añadir Certificación"}</SheetTitle>
            <SheetDescription>
              Registra los datos de tu certificación o diploma. Los campos con * son obligatorios.
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
                <FieldLabel htmlFor="certName">Nombre de la Certificación *</FieldLabel>
                <Input
                  id="certName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. AWS Certified Solutions Architect"
                  required
                />
              </Field>

              {/* Issuing Organization */}
              <Field>
                <FieldLabel htmlFor="certOrg">Autoridad Emisora *</FieldLabel>
                <Input
                  id="certOrg"
                  value={issuingOrganization}
                  onChange={(e) => setIssuingOrganization(e.target.value)}
                  placeholder="Ej. Amazon Web Services, Scrum Alliance"
                  required
                />
              </Field>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="issueDt">Fecha Expedición *</FieldLabel>
                  <Input
                    id="issueDt"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="expiryDt">Fecha Caducidad</FieldLabel>
                  <Input
                    id="expiryDt"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </Field>
              </div>

              {/* Credential ID */}
              <Field>
                <FieldLabel htmlFor="credId">ID de la Credencial</FieldLabel>
                <Input
                  id="credId"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  placeholder="Ej. AWS-ASA-12345"
                />
              </Field>

              {/* Credential URL */}
              <Field>
                <FieldLabel htmlFor="credUrl">Enlace de la Credencial (URL)</FieldLabel>
                <Input
                  id="credUrl"
                  type="url"
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  placeholder="https://credly.com/certs/..."
                />
              </Field>

              {/* Is Favorite Switch */}
              <div className="flex items-center justify-between p-1">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="favCert">
                    Destacar certificación
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Aparecerá en el bloque destacado de tu perfil.
                  </p>
                </div>
                <Switch
                  id="favCert"
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
              {editingId ? "Guardar Cambios" : "Añadir Certificación"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
