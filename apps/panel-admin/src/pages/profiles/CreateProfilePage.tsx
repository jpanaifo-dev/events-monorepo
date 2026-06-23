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
import { Switch } from "@/components/ui/switch"
import { createSessionlessClient } from "@/utils/supabase-sessionless"
import { CheckCircle2, AlertTriangle, Copy, Check } from "lucide-react"
import { uploadToR2 } from "@/utils/r2-storage"
import { supabase } from "@/utils/supabase"
import { sendEmailWithResend } from "@/utils/resend"

// Helper to generate a strong random password
function generateRandomPassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function CreateProfilePage() {
  const navigate = useNavigate()
  const { createProfile, updateProfile } = useAdminProfilesStore()

  // Form states
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [identityDocumentType, setIdentityDocumentType] = useState("")
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [institution, setInstitution] = useState("")
  const [dedication, setDedication] = useState("")
  const [bio, setBio] = useState("")
  const [globalRole, setGlobalRole] = useState("user")
  const [accountType, setAccountType] = useState("basic")
  
  const [createAccount, setCreateAccount] = useState(false)
  const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

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

    if (createAccount && !email.trim()) {
      setFormError("El correo electrónico es obligatorio para crear una cuenta de acceso automáticamente.")
      setIsSubmitting(false)
      return
    }

    try {
      let linkedAuthId: string | null = null
      let generatedPassword = ""

      if (createAccount) {
        generatedPassword = generateRandomPassword()
        const tempClient = createSessionlessClient()
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: email.trim(),
          password: generatedPassword,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            }
          }
        })

        if (authError) throw authError
        if (authData?.user) {
          linkedAuthId = authData.user.id
          
          // Delete the profile automatically created by the Supabase Auth database trigger
          await supabase.from("profiles").delete().eq("id", linkedAuthId)
        }
      }

      const newProfileId = await createProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        avatarUrl: null, // Initially null, we will upload it after creation
        phone: phone.trim() || null,
        identityDocumentType: identityDocumentType || null,
        identityDocumentNumber: identityDocumentNumber.trim() || null,
        institution: institution.trim() || null,
        dedication: dedication.trim() || null,
        bio: bio.trim() || null,
        globalRole,
        accountType,
        authId: linkedAuthId,
      })

      // If they selected a file to upload, upload it now
      if (avatarFile) {
        try {
          const publicUrl = await uploadToR2(avatarFile, "avatars", newProfileId)
          await updateProfile(newProfileId, { avatarUrl: publicUrl })
        } catch (uploadErr) {
          console.error("Delayed avatar upload failed:", uploadErr)
          toast.error("El perfil se creó, pero no se pudo subir la foto de perfil.")
        }
      } else if (avatarUrl) {
        // If they pasted a manual web URL (not a local blob URL)
        if (!avatarUrl.startsWith("blob:")) {
          await updateProfile(newProfileId, { avatarUrl })
        }
      }

      toast.success("Perfil registrado correctamente")

      if (createAccount) {
        // Send email with Resend
        const emailSubject = "Tus credenciales de acceso a la plataforma Zynqro"
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #e11d48;">¡Tu cuenta de Zynqro ha sido creada!</h2>
            <p>Hola <strong>${firstName.trim()} ${lastName.trim()}</strong>,</p>
            <p>Se ha configurado una cuenta de acceso para tu perfil en la plataforma de forma automática.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
              <p style="margin: 5px 0;"><strong>Usuario (Correo):</strong> ${email.trim()}</p>
              <p style="margin: 5px 0;"><strong>Contraseña temporal:</strong> <code style="font-size: 1.1em; color: #1e293b; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${generatedPassword}</code></p>
            </div>
            <p style="color: #64748b; font-size: 0.9em;">* Por razones de seguridad, te sugerimos ingresar a la plataforma y cambiar esta contraseña temporal a la mayor brevedad posible.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.8em; color: #94a3b8; text-align: center;">Zynqro Events Platform</p>
          </div>
        `
        const emailResult = await sendEmailWithResend(email.trim(), emailSubject, emailHtml)
        if (!emailResult.success) {
          toast.warning(`Perfil y cuenta creados, pero el correo no se pudo enviar: ${emailResult.error || "API Key no configurada"}`)
        } else {
          toast.success("Perfil y cuenta creados con éxito, correo enviado.")
        }

        setCredentialsModal({
          email: email.trim(),
          password: generatedPassword
        })
      } else {
        navigate("/dashboard/profiles")
      }
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
                  onChange={(newVal) => {
                    setAvatarUrl(newVal)
                    if (!newVal) {
                      setAvatarFile(null)
                    }
                  }}
                  onFileSelect={setAvatarFile}
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

            {/* Create Auth Account Toggle */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-t border-border/50 pt-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-normal text-foreground block">
                  Cuenta de Acceso
                </label>
                <p className="text-xs text-muted-foreground">Crear automáticamente un usuario para el inicio de sesión.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={createAccount}
                    onCheckedChange={setCreateAccount}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm font-medium text-foreground">
                    Crear cuenta de acceso automáticamente
                  </span>
                </div>
                {createAccount && (
                  <p className="text-xs text-amber-500 mt-2">
                    * Se generará una contraseña aleatoria y se mostrará al guardar para que puedas copiarla. Se requiere un correo electrónico.
                  </p>
                )}
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

      {/* Credentials Presentation Modal (Blurred Overlay) */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-6 transform scale-95 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-base">¡Cuenta Creada con Éxito!</h4>
                <p className="text-xs text-muted-foreground">Copia estas credenciales para entregarlas al usuario.</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/30 p-4 border border-border/50 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider mb-1">
                    Usuario (Correo)
                  </span>
                  <p className="text-sm font-medium select-all text-foreground truncate break-all">
                    {credentialsModal.email}
                  </p>
                </div>
                
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider mb-1">
                    Contraseña Temporal
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-background border border-border/50 rounded-lg px-3 py-2">
                    <code className="text-sm font-mono font-bold select-all text-foreground">
                      {credentialsModal.password}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        const text = `Usuario: ${credentialsModal.email}\nContraseña: ${credentialsModal.password}`
                        navigator.clipboard.writeText(text)
                        setCopied(true)
                        toast.success("Credenciales copiadas al portapapeles")
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                      title="Copiar contraseña"
                    >
                      {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-500 flex gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>
                  El usuario debe cambiar esta contraseña temporal a la mayor brevedad posible para asegurar su acceso.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => {
                  setCredentialsModal(null)
                  navigate("/dashboard/profiles")
                }}
                className="w-full font-semibold text-sm transition-all"
              >
                Entendido y Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
