import React from "react"
import { ArrowLeft } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  actionButton?: React.ReactNode
  showBackButton?: boolean
  onBackClick?: () => void
}

export function PageHeader({
  title,
  description,
  actionButton,
  showBackButton = false,
  onBackClick,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-start gap-4">
        {showBackButton && (
          <button
            onClick={onBackClick}
            className="flex items-center justify-center p-2 border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            aria-label="Volver"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-medium tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actionButton && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  )
}
