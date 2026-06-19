'use client'

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from '@/components/ui/sheet'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command'
import { cn } from '@/libs/utils'
import {
    X,
    ChevronDown,
    RotateCcw,
    Check,
    SlidersHorizontal,
    Search,
    Calendar as CalendarIcon
} from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

export type FilterType =
    | 'text'
    | 'select'
    | 'date'
    | 'native-date'
    | 'number'
    | 'searchable-select'

export interface FilterOption {
    value: string
    label: string
}

export interface FilterConfig {
    key: string
    label: string
    type: FilterType
    placeholder?: string
    options?: FilterOption[]
    defaultValue?: string | string[] | Date | number | null
    isBasic?: boolean
    description?: string
    className?: string
    min?: string
    max?: string
}

export type FilterValue = string | string[] | Date | number | null | undefined

export interface FilterValues {
    [key: string]: FilterValue
}

interface DynamicFiltersProps {
    filters: FilterConfig[]
    values: FilterValues
    onChange: (values: FilterValues) => void
    onApply?: (values: FilterValues) => void
    maxBasicFilters?: number
    className?: string
    modalTitle?: string
}

const DebouncedInput = ({
    value,
    onChange,
    placeholder,
    className,
    icon: Icon,
    type = 'text'
}: {
    value: string,
    onChange: (val: string) => void,
    placeholder?: string,
    className?: string,
    icon?: any,
    type?: string
}) => {
    const [localValue, setLocalValue] = useState(value)

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    const debouncedOnChange = useDebouncedCallback((val: string) => {
        onChange(val)
    }, 500)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setLocalValue(val)
        debouncedOnChange(val)
    }

    return (
        <div className="relative group">
            {Icon && <Icon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />}
            <Input
                type={type}
                placeholder={placeholder}
                value={localValue}
                onChange={handleChange}
                className={cn(Icon && "pl-8", className)}
            />
        </div>
    )
}

export const DynamicFilters = ({
    filters,
    values,
    onChange,
    onApply,
    maxBasicFilters = 4,
    className,
    modalTitle = 'Filtros Avanzados'
}: DynamicFiltersProps) => {

    const { basicFilters, advancedFilters } = useMemo(() => {
        const basic = filters.filter(f => f.isBasic).slice(0, maxBasicFilters)
        const advanced = filters.filter(f => !f.isBasic || filters.indexOf(f) >= maxBasicFilters)

        return {
            basicFilters: basic.length > 0 ? basic : filters.slice(0, maxBasicFilters),
            advancedFilters: basic.length > 0 ? advanced : filters.slice(maxBasicFilters)
        }
    }, [filters, maxBasicFilters])

    const activeFiltersCount = useMemo(() => {
        return Object.entries(values).filter(([key, value]) => {
            const filter = filters.find((f) => f.key === key)
            if (!filter) return false
            if (value === null || value === undefined || value === '' || value === 'ALL') return false
            if (filter.defaultValue !== undefined && value === filter.defaultValue) return false
            return true
        }).length
    }, [values, filters])

    const updateFilter = useCallback(
        (key: string, value: FilterValue) => {
            const newValues = { ...values, [key]: value === 'ALL' ? '' : value }
            onChange(newValues)
        },
        [values, onChange]
    )

    const clearFilter = useCallback(
        (key: string) => {
            const newValues = { ...values, [key]: '' }
            onChange(newValues)
        },
        [values, onChange]
    )

    const clearAllFilters = useCallback(() => {
        const newValues = filters.reduce((acc, filter) => {
            acc[filter.key] = ''
            return acc
        }, {} as FilterValues)
        onChange(newValues)
    }, [filters, onChange])

    const renderFilterInput = (filter: FilterConfig) => {
        const value = values[filter.key]
        const commonClasses = "h-9 text-xs rounded-xl shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20"

        switch (filter.type) {
            case 'text':
                return (
                    <DebouncedInput
                        placeholder={filter.placeholder || `Buscar ${filter.label}...`}
                        value={(value as string) || ''}
                        onChange={(val) => updateFilter(filter.key, val)}
                        className={commonClasses}
                        icon={Search}
                    />
                )

            case 'number':
                return (
                    <DebouncedInput
                        type="number"
                        placeholder={filter.placeholder}
                        value={(value as string) || ''}
                        onChange={(val) => updateFilter(filter.key, val)}
                        className={commonClasses}
                    />
                )

            case 'select':
                return (
                    <Select
                        value={(value as string) || 'ALL'}
                        onValueChange={(v) => updateFilter(filter.key, v)}
                    >
                        <SelectTrigger className={commonClasses}>
                            <SelectValue placeholder={filter.placeholder || 'Todos'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            {filter.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )

            case 'native-date':
                return (
                    <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            type="date"
                            min={filter.min}
                            max={filter.max}
                            value={(value as string) || ''}
                            onChange={(e) => updateFilter(filter.key, e.target.value)}
                            className={cn("pl-8", commonClasses)}
                        />
                    </div>
                )

            case 'searchable-select':
                const selected = filter.options?.find(o => o.value === value)
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between font-normal", commonClasses)}
                            >
                                <span className="truncate">{selected?.label || filter.placeholder || 'Seleccionar...'}</span>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                                <CommandInput placeholder={`Buscar ${filter.label}...`} className="h-9 text-xs" />
                                <CommandList>
                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="ALL"
                                            onSelect={() => updateFilter(filter.key, 'ALL')}
                                            className="text-xs"
                                        >
                                            <Check className={cn("mr-2 h-3.5 w-3.5", !value || value === 'ALL' ? "opacity-100" : "opacity-0")} />
                                            Todos
                                        </CommandItem>
                                        {filter.options?.map((opt) => (
                                            <CommandItem
                                                key={opt.value}
                                                value={opt.value}
                                                onSelect={() => updateFilter(filter.key, opt.value)}
                                                className="text-xs"
                                            >
                                                <Check className={cn("mr-2 h-3.5 w-3.5", value === opt.value ? "opacity-100" : "opacity-0")} />
                                                {opt.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )

            default:
                return null
        }
    }

    const renderFilter = (filter: FilterConfig) => (
        <div key={filter.key} className={cn("space-y-1.5 flex-1 min-w-[160px]", filter.className)}>
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                {filter.label}
            </label>
            {renderFilterInput(filter)}
        </div>
    )

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-wrap items-end gap-3 p-4 bg-card border rounded-2xl shadow-sm transition-all hover:shadow-md">
                {/* Basic Filters */}
                {basicFilters.map(renderFilter)}

                {/* Advanced Filters Trigger */}
                {advancedFilters.length > 0 && (
                    <div className="flex items-end pb-0.5">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 rounded-xl border-dashed gap-2 text-xs font-semibold hover:bg-primary/5 hover:text-primary transition-all">
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Filtros ({advancedFilters.length})
                                    {activeFiltersCount > 0 && (
                                        <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
                                <SheetHeader className="p-6 pb-2">
                                    <SheetTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                                        {modalTitle}
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <div className="space-y-6">
                                        {advancedFilters.map((f) => (
                                            <div key={f.key} className="space-y-2 pb-4 border-b border-dashed last:border-0">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[11px] font-bold uppercase text-foreground/70 tracking-wider">
                                                        {f.label}
                                                    </Label>
                                                    {values[f.key] && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => clearFilter(f.key)}
                                                            className="h-6 text-xs text-muted-foreground hover:text-destructive px-2"
                                                        >
                                                            Limpiar
                                                        </Button>
                                                    )}
                                                </div>
                                                {renderFilterInput(f)}
                                                {f.description && <p className="text-xs text-muted-foreground italic">{f.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <SheetFooter className="flex-col sm:flex-col gap-2 p-6 pt-2 border-t bg-muted/5">
                                    <Button onClick={onApply ? () => onApply(values) : undefined} className="w-full rounded-xl h-11 font-bold">
                                        Aplicar Filtros
                                    </Button>
                                    <Button variant="ghost" onClick={clearAllFilters} className="w-full text-xs text-muted-foreground hover:text-destructive">
                                        Restablecer Todos
                                    </Button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                )}

                {/* Reset Button */}
                <div className="flex items-end pb-0.5 ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl gap-2 transition-all"
                        onClick={clearAllFilters}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Limpiar Todo
                    </Button>
                </div>
            </div>

            {/* Active Filters Badges */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                    {Object.entries(values).map(([key, value]) => {
                        const filter = filters.find((f) => f.key === key)
                        if (!filter || !value || value === 'ALL' || (filter.defaultValue !== undefined && value === filter.defaultValue)) return null

                        let displayValue: string = String(value)
                        if (filter.type === 'select' || filter.type === 'searchable-select') {
                            const opt = filter.options?.find(o => o.value === value)
                            displayValue = opt?.label || displayValue
                        }

                        return (
                            <Badge
                                key={key}
                                variant="outline"
                                className="bg-primary/5 border-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 group transition-all hover:bg-primary/10"
                            >
                                <span className="opacity-60">{filter.label}:</span>
                                <span>{displayValue}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-3.5 w-3.5 p-0 rounded-full hover:bg-primary/20 text-primary"
                                    onClick={() => clearFilter(key)}
                                >
                                    <X className="h-2.5 w-2.5" />
                                </Button>
                            </Badge>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
