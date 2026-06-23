import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { z } from "zod"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useSEO } from "@/hooks/use-seo"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"

export function ProfileManageInfoSection() {
  const { profileId } = useParams<{ profileId: string }>()
  const { profiles, updateProfile } = useAdminProfilesStore()
  const targetProfile = profiles.find((p) => p.id === profileId)

  useSEO({
    title: targetProfile ? `Gestionar Perfil - ${targetProfile.firstName}` : "Gestionar Perfil",
    description: "Configura la información y privilegios de acceso del perfil seleccionado."
  })

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [institution, setInstitution] = useState("")
  const [dedication, setDedication] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [identityDocumentType, setIdentityDocumentType] = useState("")
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (targetProfile) {
      setFirstName(targetProfile.firstName || "")
      setLastName(targetProfile.lastName || "")
      setPhone(targetProfile.phone || "")
      setBio(targetProfile.bio || "")
      setInstitution(targetProfile.institution || "")
      setDedication(targetProfile.dedication || "")
      setAvatarUrl(targetProfile.avatarUrl || "")
      setIdentityDocumentType(targetProfile.identityDocumentType || "")
      setIdentityDocumentNumber(targetProfile.identityDocumentNumber || "")
    }
  }, [targetProfile])

  const profileSchema = z.object({
    firstName: z.string().trim().min(1, "El nombre es requerido."),
    lastName: z.string().trim().min(1, "El apellido es requerido."),
    avatarUrl: z.string().trim().url("El enlace del avatar no es válido.").or(z.literal("")).optional(),
    identityDocumentType: z.string().trim().optional().nullable(),
    identityDocumentNumber: z.string().trim().optional().nullable(),
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId) return

    const validation = profileSchema.safeParse({
      firstName,
      lastName,
      avatarUrl,
      identityDocumentType,
      identityDocumentNumber,
    })

    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)

    try {
      await updateProfile(profileId, {
        firstName,
        lastName,
        phone: phone || null,
        bio: bio || null,
        institution: institution || null,
        dedication: dedication || null,
        avatarUrl: avatarUrl || null,
        identityDocumentType: identityDocumentType || null,
        identityDocumentNumber: identityDocumentNumber || null,
      })

      toast.success("Perfil actualizado con éxito")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al guardar los cambios.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!targetProfile) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
        Cargando información del perfil...
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {/* Email Row (Disabled) */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
            <p className="text-xs text-muted-foreground">La dirección de correo de este usuario.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <div className="flex items-stretch rounded-md border border-input bg-muted/35 overflow-hidden text-sm px-3 py-2 select-none text-muted-foreground">
              <span className="flex-1 truncate">{targetProfile.email}</span>
            </div>
          </div>
        </div>

        {/* Name Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="first-name" className="text-sm font-medium text-foreground">
              Nombre <span className="text-destructive">*</span>
            </label>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="first-name"
              type="text"
              placeholder="Ej. Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Last Name Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="last-name" className="text-sm font-medium text-foreground">
              Apellido <span className="text-destructive">*</span>
            </label>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="last-name"
              type="text"
              placeholder="Ej. Pérez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Phone Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">Teléfono</label>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="phone"
              type="tel"
              placeholder="Ej. +51 987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Document Type Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="doc-type" className="text-sm font-medium text-foreground">Tipo de Documento</label>
            <p className="text-xs text-muted-foreground">Tipo de documento de identidad del usuario.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <select
              id="doc-type"
              value={identityDocumentType}
              onChange={(e) => setIdentityDocumentType(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Ninguno</option>
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>
        </div>

        {/* Document Number Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="doc-number" className="text-sm font-medium text-foreground">Número de Documento</label>
            <p className="text-xs text-muted-foreground">Número de identidad del documento correspondiente.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="doc-number"
              type="text"
              placeholder="Ej. 12345678"
              value={identityDocumentNumber}
              onChange={(e) => setIdentityDocumentNumber(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Avatar Upload Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label className="text-sm font-medium text-foreground">Foto de Perfil</label>
            <p className="text-xs text-muted-foreground">Sube una imagen o proporciona una URL directa.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <ImageUploadWithPreview
              value={avatarUrl}
              onChange={async (newUrl) => {
                setAvatarUrl(newUrl)
                if (profileId) {
                  try {
                    await updateProfile(profileId, { avatarUrl: newUrl || null })
                    toast.success("Foto de perfil actualizada en la base de datos")
                  } catch (err: any) {
                    console.error("Failed to auto-update avatar in DB:", err)
                    toast.error("No se pudo actualizar la foto de perfil en la base de datos.")
                  }
                }
              }}
              label=""
              folder="avatars"
              identifier={`profile-${firstName}-${lastName}`}
            />
          </div>
        </div>

        {/* Institution Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="institution" className="text-sm font-medium text-foreground">Institución</label>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="institution"
              type="text"
              placeholder="Ej. Universidad o Empresa"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Dedication Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="dedication" className="text-sm font-medium text-foreground">Dedicación / Rol Profesional</label>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="dedication"
              type="text"
              placeholder="Ej. Desarrollador, Diseñador, Investigador"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Bio Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="bio" className="text-sm font-medium text-foreground">Biografía</label>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <textarea
              id="bio"
              rows={4}
              placeholder="Escribe algo sobre ti..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring/50 text-foreground"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Actions Row */}
        <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-medium px-5 transition-colors"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </form>
  )
}
