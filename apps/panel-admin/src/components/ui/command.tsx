import * as React from "react"
import { cn } from "@/lib/utils"

type CommandContextType = {
  search: string
  setSearch: (search: string) => void
  matchedCount: number
  registerItem: (id: string, matches: boolean) => void
  deregisterItem: (id: string) => void
}

const CommandContext = React.createContext<CommandContextType | undefined>(undefined)

export function Command({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [search, setSearch] = React.useState("")
  const [items, setItems] = React.useState<Record<string, boolean>>({})

  const registerItem = React.useCallback((id: string, matches: boolean) => {
    setItems(prev => {
      if (prev[id] === matches) return prev
      return { ...prev, [id]: matches }
    })
  }, [])

  const deregisterItem = React.useCallback((id: string) => {
    setItems(prev => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const matchedCount = Object.values(items).filter(Boolean).length

  return (
    <CommandContext.Provider value={{ search, setSearch, matchedCount, registerItem, deregisterItem }}>
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-card text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CommandContext.Provider>
  )
}

export function CommandInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const context = React.useContext(CommandContext)
  if (!context) throw new Error("CommandInput must be used within a Command")

  return (
    <div className="flex items-center border-b px-3 border-border" cmd-input-wrapper="">
      <input
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        value={context.search}
        onChange={(e) => context.setSearch(e.target.value)}
        {...props}
      />
    </div>
  )
}

export function CommandList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden p-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CommandEmpty({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(CommandContext)
  if (!context) throw new Error("CommandEmpty must be used within a Command")

  if (context.matchedCount > 0) return null

  return (
    <div
      className={cn("py-6 text-center text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CommandGroup({
  className,
  children,
  title,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { title?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmd-group-heading]]:px-2 [&_[cmd-group-heading]]:py-1.5 [&_[cmd-group-heading]]:text-xs [&_[cmd-group-heading]]:font-medium [&_[cmd-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {title && <div cmd-group-heading="">{title}</div>}
      <div>{children}</div>
    </div>
  )
}

export function CommandItem({
  className,
  value,
  onSelect,
  children,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  value: string
  onSelect?: (value: string) => void
}) {
  const context = React.useContext(CommandContext)
  if (!context) throw new Error("CommandItem must be used within a Command")

  const id = React.useId()
  const contentText = typeof children === "string" ? children : value

  const matches = React.useMemo(() => {
    if (!context.search) return true
    return contentText.toLowerCase().includes(context.search.toLowerCase()) || value.toLowerCase().includes(context.search.toLowerCase())
  }, [context.search, contentText, value])

  React.useEffect(() => {
    context.registerItem(id, matches)
    return () => context.deregisterItem(id)
  }, [id, matches, context])

  if (!matches) return null

  return (
    <div
      onClick={() => onSelect?.(value)}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-hidden hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
