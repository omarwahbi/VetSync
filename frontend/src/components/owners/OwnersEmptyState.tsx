import React from "react";
import { Users, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OwnersEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAddOwner: () => void;
}

export const OwnersEmptyState: React.FC<OwnersEmptyStateProps> = ({
  hasActiveFilters,
  onClearFilters,
  onAddOwner,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-6">
        {hasActiveFilters
          ? "No owners found matching your filters. Try adjusting or clearing your filters."
          : "No owners registered yet. Add your first client to get started."}
      </p>
      {hasActiveFilters ? (
        <Button variant="outline" onClick={onClearFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      ) : (
        <Button onClick={onAddOwner}>
          <Plus className="mr-2 h-4 w-4" />
          Register New Owner
        </Button>
      )}
    </div>
  );
};
