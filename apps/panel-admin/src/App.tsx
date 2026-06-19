import { useEffect } from "react"
import { AppRouter } from "./routes/AppRouter"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useThemeStore } from "./store/theme.store"
import { Toaster } from "sonner"

function App() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  return (
    <TooltipProvider>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  )
}

export default App
