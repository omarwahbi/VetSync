import React from "react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showEllipsis?: boolean;
  maxDisplayedPages?: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showEllipsis = true,
  maxDisplayedPages = 5,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNum.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Generate pagination items with ellipsis if needed
  const generatePaginationItems = () => {
    const items: number[] = [];

    // For small number of pages, show all pages
    if (totalPages <= maxDisplayedPages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
      return items;
    }

    // For many pages, show a subset with ellipsis
    const edgePageCount = 1; // Number of pages to show at start/end
    const middlePageCount =
      maxDisplayedPages - edgePageCount * 2 - (showEllipsis ? 2 : 0); // Pages around current

    // Always show first page(s)
    for (let i = 1; i <= edgePageCount; i++) {
      items.push(i);
    }

    // Calculate start and end of middle section
    const middleStart = Math.max(
      edgePageCount + (showEllipsis ? 1 : 0),
      currentPage - Math.floor(middlePageCount / 2)
    );
    const middleEnd = Math.min(
      totalPages - edgePageCount - (showEllipsis ? 1 : 0),
      middleStart + middlePageCount - 1
    );

    // Add ellipsis before middle section if needed
    if (showEllipsis && middleStart > edgePageCount + 1) {
      items.push(-1); // Use -1 to represent ellipsis
    }

    // Add middle section
    for (let i = middleStart; i <= middleEnd; i++) {
      items.push(i);
    }

    // Add ellipsis after middle section if needed
    if (showEllipsis && middleEnd < totalPages - edgePageCount) {
      items.push(-2); // Use -2 to represent ellipsis (different key from first one)
    }

    // Always show last page(s)
    for (let i = totalPages - edgePageCount + 1; i <= totalPages; i++) {
      if (i > middleEnd) {
        items.push(i);
      }
    }

    return items;
  };

  const paginationItems = generatePaginationItems();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {currentPage > 1 ? (
            <Link
              href={createPageUrl(currentPage - 1)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 pl-2.5"
              )}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Link>
          ) : (
            <div
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 pl-2.5 pointer-events-none opacity-50"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </div>
          )}
        </PaginationItem>

        {paginationItems.map((pageNum) =>
          pageNum < 0 ? (
            <PaginationItem key={`ellipsis-${pageNum}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNum}>
              <Link
                href={createPageUrl(pageNum)}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  buttonVariants({
                    variant: pageNum === currentPage ? "outline" : "ghost",
                    size: "icon",
                  }),
                  pageNum === currentPage &&
                    "bg-muted font-medium pointer-events-none"
                )}
                aria-current={pageNum === currentPage ? "page" : undefined}
              >
                {pageNum}
              </Link>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          {currentPage < totalPages ? (
            <Link
              href={createPageUrl(currentPage + 1)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 pr-2.5"
              )}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Go to next page"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 pr-2.5 pointer-events-none opacity-50"
              )}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
