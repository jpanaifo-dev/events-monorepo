import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  imageSrc?: string
  imageAlt?: string
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  imageClassName?: string
}

export function EmptyState({
  imageSrc,
  imageAlt = "Sin datos",
  icon,
  title,
  description,
  action,
  imageClassName,
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-10 text-center max-w-xl mx-auto space-y-5 my-6 flex flex-col items-center justify-center animate-in fade-in duration-300",
        className
      )}
      {...props}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className={cn("w-56 max-h-48 mx-auto object-contain select-none pointer-events-none", imageClassName)}
        />
      )}
      {icon && !imageSrc && (
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          {icon}
        </div>
      )}
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
      {children}
    </div>
  )
}
