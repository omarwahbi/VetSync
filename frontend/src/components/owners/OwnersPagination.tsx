import React from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface OwnersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export const OwnersPagination: React.FC<OwnersPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="px-6 py-6 border-t">
      <div className="flex flex-col items-center">
        <div className="text-sm text-muted-foreground mb-3">
          Page {currentPage} of {totalPages} ({totalCount} total owners)
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
