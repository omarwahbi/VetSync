import React from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OwnersSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  totalCount?: number;
}

export const OwnersSearchFilter: React.FC<OwnersSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
  totalCount,
}) => {
  return (
    <div className="px-6 py-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search owners..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSearchChange(e.target.value)
          }
          className="pl-8 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-0"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Clear all filters
          </Button>
          <div className="ml-4 text-sm text-muted-foreground">
            {totalCount !== undefined && (
              <span>
                {totalCount} {totalCount === 1 ? "owner" : "owners"} found
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
