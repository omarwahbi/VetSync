import React from "react";
import { Users, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface OwnersEmptyStateProps {
  hasFilters: boolean;
  onReset: () => void;
  onCreateNew: () => void;
}

export const OwnersEmptyState: React.FC<OwnersEmptyStateProps> = ({
  hasFilters,
  onReset,
  onCreateNew,
}) => {
  const t = useTranslations("Owners");

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-6">
        {hasFilters ? t("noOwnersMatchFilters") : t("startByCreating")}
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={onReset}>
          <Filter className="me-2 h-4 w-4" />
          {t("clearFilters")}
        </Button>
      ) : (
        <Button onClick={onCreateNew}>
          <Plus className="me-2 h-4 w-4" />
          {t("createNewClient")}
        </Button>
      )}
    </div>
  );
};
