import { useThemeStore } from "@/store/theme.store"
import { Sun, Moon } from "lucide-react"

export function ThemeSwitch() {
  const { theme, setTheme } = useThemeStore()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="flex items-center gap-2 select-none">
      <Sun className={`h-4 w-4 transition-colors ${theme === "light" ? "text-amber-500" : "text-muted-foreground/50"}`} />
      
      {/* Slide Switch */}
      <button
        onClick={toggleTheme}
        type="button"
        role="switch"
        aria-checked={theme === "dark"}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-muted-foreground/20 dark:bg-muted-foreground/30 transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:outline-none"
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            theme === "dark" ? "translate-x-5 bg-primary-foreground" : "translate-x-0 bg-white"
          }`}
        />
      </button>

      <Moon className={`h-4 w-4 transition-colors ${theme === "dark" ? "text-indigo-400" : "text-muted-foreground/50"}`} />
    </div>
  )
}
