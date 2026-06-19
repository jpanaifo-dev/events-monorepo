import * as React from "react"
import { cn } from "@/lib/utils"

type PopoverContextType = {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined)

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const popoverRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div ref={popoverRef} className="relative inline-block w-full">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({
  children,
  asChild,
}: {
  children: React.ReactElement
  asChild?: boolean
}) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverTrigger must be used within a Popover")

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    context.setOpen(!context.open)
  }

  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ref: context.triggerRef,
    } as any)
  }

  return (
    <button
      type="button"
      ref={context.triggerRef}
      onClick={handleClick}
      className="cursor-pointer"
    >
      {children}
    </button>
  )
}

export function PopoverContent({
  className,
  children,
  align = "start",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end" }) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverContent must be used within a Popover")

  if (!context.open) return null

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[200px] rounded-md border bg-card text-foreground shadow-md animate-in fade-in-80 slide-in-from-top-1 mt-1 left-0 border-border w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
