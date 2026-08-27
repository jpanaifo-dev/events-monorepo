import { useEffect, useRef, useState } from "react"
import { api } from "@/api/client"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth.store"

const IDLE_LIMIT_MS = 30 * 60 * 1000
const WARNING_AT_MS = 25 * 60 * 1000
const RENEW_EVERY_MS = 10 * 60 * 1000

export function SessionManager() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const lastActivity = useRef(Date.now())
  const lastRenewal = useRef(Date.now())
  const [warning, setWarning] = useState(false)

  const endSession = () => {
    localStorage.removeItem("events-api-access-token")
    localStorage.removeItem("events-api-refresh-token")
    logout()
    window.location.assign("/login")
  }
  const continueSession = async () => {
    const refreshToken = localStorage.getItem("events-api-refresh-token")
    if (!refreshToken) return endSession()
    try {
      const session = await api.auth.refresh(refreshToken)
      localStorage.setItem("events-api-access-token", session.accessToken)
      localStorage.setItem("events-api-refresh-token", session.refreshToken)
      lastActivity.current = Date.now()
      lastRenewal.current = Date.now()
      setWarning(false)
    } catch { endSession() }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    const noteActivity = () => { if (!warning) lastActivity.current = Date.now() }
    const events = ["pointerdown", "keydown", "scroll", "touchstart"]
    events.forEach((event) => window.addEventListener(event, noteActivity, { passive: true }))
    const timer = window.setInterval(() => {
      const now = Date.now(); const idle = now - lastActivity.current
      if (idle >= IDLE_LIMIT_MS) return endSession()
      if (idle >= WARNING_AT_MS) return setWarning(true)
      if (!warning && now - lastRenewal.current >= RENEW_EVERY_MS) void continueSession()
    }, 15000)
    return () => { events.forEach((event) => window.removeEventListener(event, noteActivity)); window.clearInterval(timer) }
  }, [isAuthenticated, warning])

  if (!warning) return null
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Tu cuenta está por expirar</h2><p className="mt-2 text-sm text-muted-foreground">No detectamos actividad recientemente. ¿Deseas continuar con tu sesión?</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={endSession}>Cerrar sesión</Button><Button onClick={() => void continueSession()}>Continuar</Button></div></div></div>
}
