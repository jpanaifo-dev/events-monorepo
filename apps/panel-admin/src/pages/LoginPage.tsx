import { useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { LoginForm } from "@/components/login-form"

export function LoginPage() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/dashboard"
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Left side: LoginForm and header branding */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 max-w-xl mx-auto w-full">
        {/* Top Header Branding */}
        <div>
          <Link to="/dashboard" className="font-bold text-2xl text-emerald-600 dark:text-emerald-500 tracking-tighter flex items-center gap-1.5 w-fit">
            EventHive
          </Link>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8">
          <LoginForm className="w-full max-w-sm mx-auto" />
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} EventHive. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side: Image banner */}
      <div className="hidden md:block flex-1 relative bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900 flex flex-col justify-end p-12 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
          
          <blockquote className="space-y-2 relative z-10">
            <p className="text-lg font-medium leading-relaxed">
              "EventHive ha transformado por completo la manera en que planificamos y ejecutamos nuestros congresos y conferencias. Administrar ponentes, cronogramas y registros ahora es un proceso fluido e impecable."
            </p>
            <footer className="text-sm font-semibold text-white/80">
              — Carlos Mendoza, Director de Experiencias
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
