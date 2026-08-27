import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useSEO } from "@/hooks/use-seo"
import { Shield, Key, AlertTriangle, CheckCircle2, Copy, Check } from "lucide-react"
import { api } from "@/api/client"

// Helper to generate a strong random password
function generateRandomPassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function ProfileManageAccountSection() {
  const { profileId } = useParams<{ profileId: string }>()
  const { profiles, updateProfile } = useAdminProfilesStore()
  const targetProfile = profiles.find((p) => p.id === profileId)

  useSEO({
    title: targetProfile ? `Gestionar Cuenta - ${targetProfile.firstName}` : "Gestionar Cuenta",
    description: "Administra las credenciales de acceso, roles y tipo de cuenta del perfil."
  })

  const [globalRole, setGlobalRole] = useState("USER")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  
  // Credentials modal state
  const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (targetProfile) {
      setGlobalRole(targetProfile.globalRole || "USER")
    }
  }, [targetProfile])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId) return

    setIsSubmitting(true)
    try {
      if (!targetProfile?.authId) {
        toast.error("Este perfil no tiene una cuenta de acceso. Crea una cuenta antes de asignar un rol global.")
        return
      }
      await api.auth.updateUser(targetProfile.authId, { role: globalRole as "USER" | "ADMIN" | "SUPER_ADMIN" })
      toast.success("Configuración de cuenta actualizada correctamente")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al guardar los cambios.")
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleCreateAuthAccount = async () => {
    if (!profileId || !targetProfile || !targetProfile.email) return

    setIsCreatingAccount(true)
    const generatedPassword = generateRandomPassword()
    const originalEmail = targetProfile.email

    try {
      const data = await api.auth.adminCreate({ email: originalEmail, password: generatedPassword, firstName: targetProfile.firstName, lastName: targetProfile.lastName })
      const newAuthId = data.id

      // 4. Link the authId and restore the email in the original profile record
      await updateProfile(profileId, {
        authId: newAuthId,
        email: originalEmail
      })

      // 6. Open UI Modal overlay so the administrator can copy details
      setCredentialsModal({
        email: originalEmail,
        password: generatedPassword,
      })

      toast.success(data.emailSent ? "Cuenta creada y credenciales enviadas por correo." : "Cuenta creada; el correo no está configurado en el servidor.")
    } catch (err: any) {
      console.error("Error creating auth account:", err)
      toast.error(err.message || "Ocurrió un error al registrar la cuenta de acceso.")
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!credentialsModal) return
    const text = `Usuario: ${credentialsModal.email}\nContraseña: ${credentialsModal.password}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Credenciales copiadas al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!targetProfile) {
    return (
      <div className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden p-6 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/40 pb-6 last:border-0 last:pb-0">
              <div className="md:w-1/3 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Tab Header Title */}
      <div className="border-b border-border pb-3">
        <h3 className="text-lg font-bold">Gestión de Acceso y Cuenta</h3>
        <p className="text-xs text-muted-foreground">
          Controla las credenciales de acceso y el rol global. Los planes se administran por institución.
        </p>
      </div>

      {/* Auth Account Status Card */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-6 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Key className="size-4 text-primary" />
            <span>Credenciales de Autenticación</span>
          </h4>

          {targetProfile.authId ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02] p-4 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Cuenta Vinculada Activa</p>
                <p className="text-xs text-muted-foreground">
                  Este perfil ya tiene un usuario de acceso vinculado (UID: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{targetProfile.authId}</code>).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.02] p-4 flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Sin Cuenta de Acceso</p>
                  <p className="text-xs text-muted-foreground">
                    Este perfil no posee actualmente un usuario asignado. El usuario no podrá iniciar sesión en la plataforma.
                  </p>
                </div>
              </div>

              {!targetProfile.email ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/[0.02] p-4 flex items-start gap-3">
                  <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Correo Requerido</p>
                    <p className="text-xs text-muted-foreground">
                      Debes ingresar un correo electrónico en la pestaña <strong>Datos Generales</strong> antes de poder crear una cuenta de acceso para este perfil.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <Button
                    type="button"
                    onClick={handleCreateAuthAccount}
                    disabled={isCreatingAccount}
                    className="font-semibold text-xs h-9 px-4 flex items-center gap-1.5 transition-colors"
                  >
                    <Shield className="size-4" />
                    {isCreatingAccount ? "Creando Cuenta..." : "Crear Cuenta de Acceso"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Roles & Plan Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          
          {/* Global Role Select */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border bg-rose-500/[0.01]">
            <div className="md:w-1/3 space-y-1">
              <label htmlFor="globalRole" className="text-sm font-medium text-rose-500">Rol Global del Sistema</label>
              <p className="text-xs text-muted-foreground">Define el nivel de control administrativo.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Select value={globalRole} onValueChange={setGlobalRole}>
                <SelectTrigger id="globalRole" disabled={isSubmitting}>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ADMIN">Administrador del Sistema</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Form Actions Footer */}
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
                      onClick={handleCopyCredentials}
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
                onClick={() => setCredentialsModal(null)}
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
