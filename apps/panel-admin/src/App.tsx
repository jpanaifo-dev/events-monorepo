import { useEffect } from "react"
import { AppRouter } from "./routes/AppRouter"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useThemeStore } from "./store/theme.store"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute stale time by default
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
