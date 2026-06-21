import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { supabase } from "@/utils/supabase"
import { Eye, EyeOff } from "lucide-react"
import { ZynqroLogo } from "@/components/zynqro-logo"
import { useSEO } from "@/hooks/use-seo"
import { toast } from "sonner"

const resetSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(8, "La confirmación de contraseña debe tener al menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type ResetInput = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  
  useSEO({
    title: "Restablecer Contraseña",
    description: "Crea una nueva contraseña para tu cuenta de Zynqro."
  })

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ResetInput, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setIsLoading(true)

    const result = resetSchema.safeParse({ password, confirmPassword })

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ResetInput, string>> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ResetInput] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setFormError(error.message || "Error al actualizar la contraseña.")
      } else {
        toast.success("Tu contraseña ha sido restablecida correctamente.")
        navigate("/login", { replace: true })
      }
    } catch (err: any) {
      console.error(err)
      setFormError("Ocurrió un error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Left side: Reset Form and header branding */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 max-w-xl mx-auto w-full">
        {/* Top Header Branding */}
        <div>
          <Link to="/login" className="w-fit block">
            <ZynqroLogo className="h-10 w-auto" />
          </Link>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-sm mx-auto">
            <FieldGroup>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold font-sans">Restablecer Contraseña</h1>
                <p className="text-sm text-balance text-muted-foreground font-sans">
                  Ingresa tu nueva contraseña para volver a acceder a Zynqro
                </p>
              </div>
              
              {formError && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
                  {formError}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="password">Nueva Contraseña</FieldLabel>
                <div className="relative flex items-center">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn("bg-background pr-10", errors.password && "border-destructive")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1 font-semibold">{errors.password}</p>}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirmar Nueva Contraseña</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn("bg-background", errors.confirmPassword && "border-destructive")}
                  required
                />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1 font-semibold">{errors.confirmPassword}</p>}
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Actualizando..." : "Restablecer Contraseña"}
                </Button>
              </Field>

              <Field>
                <Link
                  to="/login"
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2 block"
                >
                  Volver a Iniciar Sesión
                </Link>
              </Field>
            </FieldGroup>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zynqro. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side: Image banner */}
      <div className="hidden md:block flex-1 relative bg-muted overflow-hidden">
        <img
          src="/images/login-banner.png"
          alt="Event Management"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-neutral-900/40 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <blockquote className="space-y-2 relative z-10">
            <p className="text-sm font-medium leading-relaxed max-w-xl text-gray-400">
              "Zynqro ha transformado por completo la manera en que planificamos y ejecutamos nuestros congresos y conferencias. Administrar ponentes, cronogramas y registros ahora es un proceso fluido e impecable."
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
