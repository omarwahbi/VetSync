import React from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OwnerColumnVisibility } from "./OwnersTable";

interface OwnersColumnSelectorProps {
  columnsVisibility: OwnerColumnVisibility;
  onToggleColumn: (column: keyof OwnerColumnVisibility) => void;
}

export const OwnersColumnSelector: React.FC<OwnersColumnSelectorProps> = ({
  columnsVisibility,
  onToggleColumn,
}) => {
  const t = useTranslations("Owners");
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className={`h-4 w-4 ${isRTL ? "ms-2" : "me-2"}`} />
          {t("manageColumns")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("firstName")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.firstName && <Check className="h-3 w-3" />}
          </div>
          {t("firstName")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("lastName")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.lastName && <Check className="h-3 w-3" />}
          </div>
          {t("lastName")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("email")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.email && <Check className="h-3 w-3" />}
          </div>
          {t("email")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("phone")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.phone && <Check className="h-3 w-3" />}
          </div>
          {t("phone")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("reminders")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.reminders && <Check className="h-3 w-3" />}
          </div>
          {t("reminders")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("createdBy")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.createdBy && <Check className="h-3 w-3" />}
          </div>
          {t("createdBy")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("updatedBy")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.updatedBy && <Check className="h-3 w-3" />}
          </div>
          {t("updatedBy")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => onToggleColumn("actions")}
          inset={false}
        >
          <div
            className={`${
              isRTL ? "ms-2" : "me-2"
            } h-4 w-4 flex items-center justify-center`}
          >
            {columnsVisibility.actions && <Check className="h-3 w-3" />}
          </div>
          {t("actions")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
