import React from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

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
  const t = useTranslations("Owners");
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  return (
    <div className="px-6 py-4">
      <div className="relative max-w-sm">
        <Search
          className={`absolute ${
            isRTL ? "right-2" : "left-2"
          } top-2.5 h-4 w-4 text-muted-foreground`}
        />
        <Input
          type="text"
          placeholder={t("searchOwners")}
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSearchChange(e.target.value)
          }
          className={`${isRTL ? "pr-8 pl-10" : "pl-8 pr-10"} text-start`}
          dir="auto"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className={`absolute ${
              isRTL ? "left-0" : "right-0"
            } top-0 h-full px-3 py-0`}
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t("clearSearch")}</span>
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
            <Filter className={`h-3.5 w-3.5 ${isRTL ? "ms-1" : "me-1"}`} />
            {t("clearFilters")}
          </Button>
          <div
            className={`${
              isRTL ? "me-4" : "ms-4"
            } text-sm text-muted-foreground`}
          >
            {totalCount !== undefined && (
              <span>{t.rich("totalCount", { count: totalCount })}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
