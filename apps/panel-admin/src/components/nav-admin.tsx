import { ChevronRight } from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { cn } from "@/lib/utils"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import { type AdminRouteItem } from "@/config/admin-routes"

export function NavAdmin({
    items,
    label = "Menú",
}: {
    items: AdminRouteItem[]
    label?: string
}) {
    const { pathname } = useLocation()

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
                {label}
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isDashboard = item.url === '/dashboard'
                    const isActive = isDashboard
                        ? pathname === item.url
                        : (item.url.startsWith('/dashboard/settings')
                            ? pathname.startsWith('/dashboard/settings')
                            : (pathname === item.url || pathname.startsWith(item.url + "/")))
                    
                    if (item.items && item.items.length > 0) {
                        const isSubActive = item.items.some(sub => pathname === sub.url)
                        
                        return (
                            <Collapsible
                                key={item.title}
                                defaultOpen={isSubActive || isActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton 
                                            tooltip={item.title} 
                                            isActive={false}
                                            className={cn(
                                                "w-full justify-between hover:bg-muted/50 rounded-md transition-colors",
                                                (isActive || isSubActive) ? "text-primary font-semibold" : "text-sidebar-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.icon && (
                                                    <item.icon 
                                                        className={cn(
                                                            "size-4 transition-colors", 
                                                            (isActive || isSubActive) ? "text-primary" : "text-muted-foreground group-hover/menu-button:text-sidebar-foreground"
                                                        )} 
                                                    />
                                                )}
                                                <span className="text-sm font-medium">{item.title}</span>
                                            </div>
                                            <ChevronRight className={cn(
                                                "size-4 ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
                                                (isActive || isSubActive) ? "text-primary" : "text-muted-foreground"
                                            )} />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="border-l border-border/80 ml-4 pl-2 my-1 space-y-1">
                                            {item.items.map((subItem) => {
                                                const isChildActive = pathname === subItem.url
                                                return (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton 
                                                            isActive={false} 
                                                            asChild
                                                            className={cn(
                                                                "w-full text-left hover:bg-muted/50 rounded-md transition-colors px-3 py-1.5",
                                                                isChildActive ? "text-primary font-semibold" : "text-sidebar-foreground"
                                                            )}
                                                        >
                                                            <Link to={subItem.url} className="w-full block">
                                                                <span className="text-xs font-medium">{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                )
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )
                    }
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                                tooltip={item.title} 
                                isActive={false} 
                                asChild
                                className={cn(
                                    "hover:bg-muted/50 rounded-md transition-colors",
                                    isActive ? "text-primary font-semibold" : "text-sidebar-foreground"
                                )}
                            >
                                <Link to={item.url} className="flex items-center gap-3 w-full">
                                    {item.icon && (
                                        <item.icon 
                                            className={cn(
                                                "size-4 transition-colors", 
                                                isActive ? "text-primary" : "text-muted-foreground group-hover/menu-button:text-sidebar-foreground"
                                            )} 
                                        />
                                    )}
                                    <span className="text-sm font-medium">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}
