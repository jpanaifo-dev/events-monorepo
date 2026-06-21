import React from "react"
import { cn } from "@/lib/utils"

export interface ColumnDef<T> {
  header: React.ReactNode
  accessorKey?: keyof T | string
  cell?: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  emptyState?: React.ReactNode
  containerClassName?: string
  tableClassName?: string
  theadClassName?: string
  tbodyClassName?: string
  rowClassName?: string | ((row: T, index: number) => string)
  onRowClick?: (row: T, index: number) => void
}

export function DataTable<T>({
  columns,
  data,
  emptyState,
  containerClassName = "",
  tableClassName = "",
  theadClassName = "",
  tbodyClassName = "",
  rowClassName = "",
  onRowClick
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return emptyState ? <>{emptyState}</> : null
  }

  return (
    <div className={cn("overflow-x-auto border border-border rounded-xl bg-card/10 backdrop-blur-xs", containerClassName)}>
      <table className={cn("w-full text-sm text-left border-collapse", tableClassName)}>
        <thead>
          <tr className={cn("bg-muted/40 text-xs font-bold text-muted-foreground border-b border-border uppercase", theadClassName)}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={cn("p-4", col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn("divide-y divide-border/50", tbodyClassName)}>
          {data.map((row, rowIdx) => {
            const rClassName = typeof rowClassName === "function" ? rowClassName(row, rowIdx) : rowClassName
            return (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row, rowIdx)}
                className={cn(
                  "hover:bg-muted/5 transition-colors",
                  onRowClick && "cursor-pointer",
                  rClassName
                )}
              >
                {columns.map((col, colIdx) => {
                  let content: React.ReactNode = null
                  if (col.cell) {
                    content = col.cell(row, rowIdx)
                  } else if (col.accessorKey) {
                    content = String((row as any)[col.accessorKey] ?? "")
                  }
                  return (
                    <td
                      key={colIdx}
                      className={cn("p-4", col.className)}
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
