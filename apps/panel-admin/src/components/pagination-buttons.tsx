"use client"

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export function PaginationButtons({
  totalCount,
  pageSize = 10,
}: {
  totalCount: number;
  pageSize?: number;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    setSearchParams(params);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-4 border-t border-muted/30">
      <div className="text-xs text-muted-foreground font-sans">
        Mostrando <span className="font-semibold text-foreground">{Math.min((currentPage - 1) * pageSize + 1, totalCount)}</span> - <span className="font-semibold text-foreground">{Math.min(currentPage * pageSize, totalCount)}</span> de <span className="font-semibold text-foreground">{totalCount}</span> resultados
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full border-muted/60 disabled:opacity-40 transition-all cursor-pointer"
          disabled={currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        <div className="text-xs font-semibold px-2 text-foreground/85 font-sans">
          {currentPage} <span className="text-muted-foreground/60">/</span> {totalPages}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full border-muted/60 disabled:opacity-40 transition-all cursor-pointer"
          disabled={currentPage >= totalPages}
          onClick={() => setPage(currentPage + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

