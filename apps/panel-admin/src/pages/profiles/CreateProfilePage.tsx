import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import { z } from "zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"
import { useSEO } from "@/hooks/use-seo"

export function CreateProfilePage() {
  const navigate = useNavigate()
  const { createProfile } = useAdminProfilesStore()

  // Form states
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [identityDocumentType, setIdentityDocumentType] = useState("")
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [institution, setInstitution] = useState("")
  const [dedication, setDedication] = useState("")
  const [bio, setBio] = useState("")
  const [globalRole, setGlobalRole] = useState("user")
  const [accountType, setAccountType] = useState("basic")
  
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useSEO({
    title: "Registrar Nuevo Perfil",
    description: "Crea un nuevo perfil de usuario de forma manual en la plataforma."
  })

  const profileFormSchema = z.object({
    firstName: z.string().trim().min(1, "El nombre es obligatorio."),
    lastName: z.string().trim().min(1, "El apellido es obligatorio."),
    email: z.string().trim().email("Formato de correo no válido.").or(z.literal("")).optional().nullable(),
    avatarUrl: z.string().trim().url("El enlace del avatar debe ser una URL válida.").or(z.literal("")).optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    identityDocumentType: z.string().trim().optional().nullable(),
    identityDocumentNumber: z.string().trim().optional().nullable(),
    institution: z.string().trim().optional().nullable(),
    dedication: z.string().trim().optional().nullable(),
    bio: z.string().trim().optional().nullable(),
    globalRole: z.string().min(1),
    accountType: z.string().min(1),
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setIsSubmitting(true)

    const validation = profileFormSchema.safeParse({
      firstName,
      lastName,
      email: email || null,
      avatarUrl: avatarUrl || null,
      phone: phone || null,
      identityDocumentType: identityDocumentType || null,
      identityDocumentNumber: identityDocumentNumber || null,
      institution: institution || null,
      dedication: dedication || null,
      bio: bio || null,
      globalRole,
      accountType,
    })

    if (!validation.success) {
      setFormError(validation.error.issues[0].message)
      setIsSubmitting(false)
      return
    }

    try {
      await createProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        phone: phone.trim() || null,
        identityDocumentType: identityDocumentType || null,
        identityDocumentNumber: identityDocumentNumber.trim() || null,
        institution: institution.trim() || null,
        dedication: dedication.trim() || null,
        bio: bio.trim() || null,
        globalRole,
        accountType,
      })

      toast.success("Perfil registrado correctamente")
      navigate("/dashboard/profiles")
    } catch (err: any) {
      console.error(err)
      if (err?.message?.includes("profiles_email_key")) {
        setFormError("El correo electrónico ya está registrado por otro perfil.")
      } else if (err?.message?.includes("profiles_identity_document_number_key")) {
        setFormError("El número de documento de identidad ya está registrado por otro perfil.")
      } else {
        setFormError(err?.message || "Ocurrió un error al registrar el perfil.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      <PageHeader
        title="Registrar Nuevo Perfil"
        description="Crea un nuevo perfil de usuario de forma manual en la plataforma."
        showBackButton
        onBackClick={() => navigate("/dashboard/profiles")}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-6 space-y-6">
            
            {/* First Name & Last Name */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-normal text-foreground block">
                  Nombre Completo *
                </label>
                <p className="text-xs text-muted-foreground">Nombre y apellido legal del usuario.</p>
              </div>
              <div className="md:w-2/3 w-full flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Nombre (ej. Juan)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Apellido (ej. Pérez)"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="regEmail" className="text-sm font-normal text-foreground block">
                  Correo Electrónico
                </label>
                <p className="text-xs text-muted-foreground">Debe ser único en la plataforma.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="juan.perez@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="regPhone" className="text-sm font-normal text-foreground block">
                  Teléfono
                </label>
                <p className="text-xs text-muted-foreground">Número de contacto con código de país.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <Input
                  id="regPhone"
                  type="tel"
                  placeholder="Ej. +51 987654321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Document Type & Number */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-normal text-foreground block">
                  Identificación
                </label>
                <p className="text-xs text-muted-foreground">Tipo y número del documento nacional de identidad.</p>
              </div>
              <div className="md:w-2/3 w-full flex flex-col sm:flex-row gap-3">
                <select
                  id="regDocType"
                  value={identityDocumentType}
                  onChange={(e) => setIdentityDocumentType(e.target.value)}
                  className="sm:w-1/3 w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSubmitting}
                >
                  <option value="">Ninguno</option>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="OTROS">Otros</option>
                </select>
                <Input
                  id="regDocNumber"
                  className="flex-1"
                  placeholder="Número de Documento"
                  value={identityDocumentNumber}
                  onChange={(e) => setIdentityDocumentNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-normal text-foreground block">
                  Foto de Perfil
                </label>
                <p className="text-xs text-muted-foreground">Sube una imagen o proporciona una URL directa.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <ImageUploadWithPreview
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  label=""
                  folder="avatars"
                  identifier={`profile-${firstName}-${lastName}`}
                />
              </div>
            </div>

            {/* Institution & Dedication */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-normal text-foreground block">
                  Detalles Profesionales
                </label>
                <p className="text-xs text-muted-foreground">Lugar de trabajo/estudio y cargo desempeñado.</p>
              </div>
              <div className="md:w-2/3 w-full flex flex-col sm:flex-row gap-3">
                <Input
                  id="regInstitution"
                  className="flex-1"
                  placeholder="Institución (ej. Universidad)"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  id="regDedication"
                  className="flex-1"
                  placeholder="Dedicación (ej. Investigador)"
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="regBio" className="text-sm font-normal text-foreground block">
                  Biografía
                </label>
                <p className="text-xs text-muted-foreground">Información breve o resumen profesional.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <textarea
                  id="regBio"
                  rows={4}
                  placeholder="Acerca del usuario..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Roles and Plans */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-normal text-foreground block">
                  Privilegios & Cuenta
                </label>
                <p className="text-xs text-muted-foreground">Rol de sistema y tipo de suscripción.</p>
              </div>
              <div className="md:w-2/3 w-full flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="regGlobalRole" className="text-xs font-normal text-muted-foreground block">Rol Global</label>
                  <select
                    id="regGlobalRole"
                    value={globalRole}
                    onChange={(e) => setGlobalRole(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isSubmitting}
                  >
                    <option value="user">Usuario Regular</option>
                    <option value="admin">Administrador</option>
                    <option value="developer">Developer</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="regAccountType" className="text-xs font-normal text-muted-foreground block">Plan / Cuenta</label>
                  <select
                    id="regAccountType"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isSubmitting}
                  >
                    <option value="basic">Gratuito</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

        {formError && (
          <p className="text-sm text-destructive font-medium">{formError}</p>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/profiles")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar Perfil"}
          </Button>
        </div>
      </form>

    </div>
  )
}
