import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  // Add an optional onPageChange prop that components can use instead of URL navigation
  onPageChange?: (page: number) => void;
}

export function SimplePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: SimplePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  if (totalPages <= 1) {
    return null;
  }

  // Function to navigate to a specific page
  const goToPage = (pageNumber: number) => {
    if (onPageChange) {
      // If an onPageChange handler is provided, use it
      onPageChange(pageNumber);
      return;
    }

    // Create a new URLSearchParams object from the current search params
    const params = new URLSearchParams(searchParams.toString());

    // Set the page parameter
    params.set("page", pageNumber.toString());

    // Navigate to the new URL - use replace to avoid caching issues
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Generate page numbers to display (show 5 pages max)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);

      if (currentPage <= 3) {
        // Near the start
        pageNumbers.push(2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        // In the middle
        pageNumbers.push(currentPage - 1, currentPage, currentPage + 1);

        // Add ellipsis indicators
        if (currentPage - 1 > 2) pageNumbers.splice(1, 0, -1); // Add ellipsis after 1
        if (currentPage + 1 < totalPages - 1) pageNumbers.push(-2); // Add ellipsis before last page

        // Add last page if not already added
        if (pageNumbers[pageNumbers.length - 1] !== totalPages) {
          pageNumbers.push(totalPages);
        }
      }
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-6 py-6 border-t">
      <div className="flex flex-col items-center">
        <div className="text-sm text-muted-foreground mb-3">
          Page {currentPage} of {totalPages} ({totalCount} total)
        </div>

        <div className="flex items-center gap-2">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, idx) =>
              pageNum < 0 ? (
                // Ellipsis
                <div key={`ellipsis-${idx}`} className="px-3 py-2">
                  ...
                </div>
              ) : (
                // Page number button
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => pageNum !== currentPage && goToPage(pageNum)}
                  className="w-9 h-9 p-0"
                >
                  {pageNum}
                </Button>
              )
            )}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
