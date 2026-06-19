"use client"

import React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface FormFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "fixed" | "sticky";
}

export function FormFooter({ children, className, style, variant = "fixed", ...props }: FormFooterProps) {
  const { state, isMobile } = useSidebar();

  if (variant === "sticky") {
    return (
      <div
        className={cn(
          "sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background/95 px-6 py-4 backdrop-blur-md -mb-6 mt-auto",
          className
        )}
        {...props}
      >
        <div className="flex justify-end w-full gap-2">
          {children}
        </div>
      </div>
    );
  }

  const leftMargin = isMobile
    ? "0px"
    : state === "collapsed"
      ? "var(--sidebar-width-icon)"
      : "var(--sidebar-width)";

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 right-0 z-[9] flex items-center justify-end gap-2 border-t bg-background/80 px-4 py-4 backdrop-blur-md sm:px-8 transition-[left] duration-200 ease-linear",
          className
        )}
        style={{ left: leftMargin, ...style }}
        {...props}
      >
        <div className="flex justify-end w-full container mx-auto px-4 gap-4">
          {children}
        </div>
      </div>
    </>
  );
}
