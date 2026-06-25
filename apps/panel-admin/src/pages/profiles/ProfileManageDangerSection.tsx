import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldAlert, AlertTriangle, Trash2, CheckCircle2 } from "lucide-react"
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

export function ProfileManageDangerSection() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const { profiles, updateProfile, deleteProfile } = useAdminProfilesStore()
  const targetProfile = profiles.find((p) => p.id === profileId)

  useSEO({
    title: targetProfile ? `Zona de Peligro - ${targetProfile.firstName}` : "Zona de Peligro",
    description: "Desactiva o elimina permanentemente la cuenta de usuario."
  })

  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleActive = async (val: boolean) => {
    if (!profileId) return
    try {
      await updateProfile(profileId, { isPublic: val })
      toast.success(
        val
          ? "Perfil activado y visible públicamente"
          : "Perfil desactivado (privado) correctamente"
      )
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Error al actualizar el estado del perfil")
    }
  }

  const handleDeleteProfile = async () => {
    if (!profileId) return
    setIsDeleting(true)
    try {
      await deleteProfile(profileId)
      toast.success("Perfil eliminado permanentemente del sistema")
      navigate("/dashboard/profiles")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Error al eliminar el perfil")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!targetProfile) {
    return (
      <div className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden p-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6 last:border-0 last:pb-0">
              <div className="md:w-2/3 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-80" />
              </div>
              <div className="md:w-1/3 flex justify-end">
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="border-b border-border pb-3">
        <h3 className="text-lg font-bold">Zona de Peligro</h3>
        <p className="text-xs text-muted-foreground">
          Acciones de visibilidad, suspensión y eliminación del perfil de usuario.
        </p>
      </div>

      {/* Deactivate switch card */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              {targetProfile.isPublic ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Perfil Activo y Público</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-4 text-amber-500" />
                  <span>Perfil Desactivado / Privado</span>
                </>
              )}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Los perfiles privados o desactivados no aparecen en directorios públicos, buscadores ni listas de ponentes, pero conservan sus datos para uso de administración.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground font-medium">Activo:</span>
            <Switch
              checked={targetProfile.isPublic}
              onCheckedChange={handleToggleActive}
            />
          </div>
        </div>
      </div>

      {/* Permanently Delete Card */}
      <div className="border border-destructive/30 rounded-xl bg-destructive/[0.02] overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <ShieldAlert className="size-4" />
              <span>Eliminar Cuenta Permanentemente</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Al eliminar la cuenta de {targetProfile.firstName} {targetProfile.lastName}, se borrarán de forma inmediata y en cascada todos sus registros de estudios, historial laboral y certificaciones asociadas. Esta acción no se puede deshacer.
            </p>
          </div>
          
          <div className="shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="font-semibold text-xs h-9 px-4 flex items-center gap-1.5"
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4" />
                  Eliminar Perfil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <ShieldAlert className="size-5" />
                    <span>¿Eliminar este perfil permanentemente?</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3 pt-2 text-sm">
                    <p>
                      Estás a punto de borrar la cuenta de <strong>{targetProfile.firstName} {targetProfile.lastName}</strong> ({targetProfile.email}).
                    </p>
                    <p className="font-semibold text-foreground bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-xs flex items-start gap-2">
                      <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                      <span>
                        Se eliminarán también todos sus registros en cascada de estudios académicos, experiencias profesionales e insignias/certificados.
                      </span>
                    </p>
                    <p>¿Confirmas que deseas proceder con la eliminación destructiva?</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProfile}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
                  >
                    Sí, eliminar perfil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

    </div>
  )
}
