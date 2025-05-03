import React from "react";
import { Owner } from "@/hooks/useOwners";
import Link from "next/link";
import { formatPhoneNumberForWhatsApp } from "@/lib/phoneUtils";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye, MessageSquare } from "lucide-react";

export interface OwnerColumnVisibility {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  phone: boolean;
  reminders: boolean;
  createdBy: boolean;
  updatedBy: boolean;
  actions: boolean;
}

interface OwnersTableProps {
  owners: Owner[];
  columnsVisibility: OwnerColumnVisibility;
  onEdit: (owner: Owner) => void;
  onDelete: (owner: Owner) => void;
  meta?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
}

export const OwnersTable: React.FC<OwnersTableProps> = ({
  owners,
  columnsVisibility,
  onEdit,
  onDelete,
  meta,
}) => {
  const t = useTranslations("Owners");
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  if (!owners || owners.length === 0) {
    return null;
  }

  return (
    <Table className="w-full">
      {meta && (
        <TableCaption className="text-sm text-muted-foreground">
          {t.rich("totalCount", { count: meta.totalCount })}
        </TableCaption>
      )}
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-muted/50">
          {columnsVisibility.firstName && (
            <TableHead className="font-medium text-start">
              {t("firstName")}
            </TableHead>
          )}
          {columnsVisibility.lastName && (
            <TableHead className="font-medium text-start">
              {t("lastName")}
            </TableHead>
          )}
          {columnsVisibility.email && (
            <TableHead className="font-medium text-start">
              {t("email")}
            </TableHead>
          )}
          {columnsVisibility.phone && (
            <TableHead className="font-medium text-start">
              {t("phone")}
            </TableHead>
          )}
          {columnsVisibility.reminders && (
            <TableHead className="font-medium text-start">
              {t("reminders")}
            </TableHead>
          )}
          {columnsVisibility.createdBy && (
            <TableHead className="font-medium text-start">
              {t("createdBy")}
            </TableHead>
          )}
          {columnsVisibility.updatedBy && (
            <TableHead className="font-medium text-start">
              {t("updatedBy")}
            </TableHead>
          )}
          {columnsVisibility.actions && (
            <TableHead className="text-center font-medium w-20">
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y">
        {owners.map((owner: Owner) => {
          const whatsappNumber = formatPhoneNumberForWhatsApp(owner.phone);

          return (
            <TableRow key={owner.id} className="hover:bg-muted/50">
              {columnsVisibility.firstName && (
                <TableCell className="font-medium text-start">
                  <Link
                    href={`/${locale}/owners/${owner.id}`}
                    className="text-primary hover:underline"
                  >
                    {owner.firstName}
                  </Link>
                </TableCell>
              )}
              {columnsVisibility.lastName && (
                <TableCell className="text-muted-foreground text-start">
                  {owner.lastName}
                </TableCell>
              )}
              {columnsVisibility.email && (
                <TableCell className="text-muted-foreground text-start">
                  {owner.email || "-"}
                </TableCell>
              )}
              {columnsVisibility.phone && (
                <TableCell className="text-muted-foreground text-start">
                  <div className="flex items-center gap-2">
                    <span>{owner.phone}</span>
                    {whatsappNumber && (
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                        title={t("chatWithOnWhatsApp", {
                          name: owner.firstName,
                        })}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </TableCell>
              )}
              {columnsVisibility.reminders && (
                <TableCell className="text-muted-foreground text-start">
                  {owner.allowAutomatedReminders ? (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      {t("reminderEnabled")}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-800"
                    >
                      {t("reminderDisabled")}
                    </Badge>
                  )}
                </TableCell>
              )}
              {columnsVisibility.createdBy && (
                <TableCell className="text-muted-foreground text-start">
                  {owner.createdBy
                    ? `${owner.createdBy.firstName || ""} ${
                        owner.createdBy.lastName || ""
                      }`.trim() || t("unknown")
                    : t("system")}
                </TableCell>
              )}
              {columnsVisibility.updatedBy && (
                <TableCell className="text-muted-foreground text-start">
                  {owner.updatedBy
                    ? `${owner.updatedBy.firstName || ""} ${
                        owner.updatedBy.lastName || ""
                      }`.trim() || t("unknown")
                    : t("system")}
                </TableCell>
              )}
              {columnsVisibility.actions && (
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">{t("openMenu")}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-start"
                        inset={false}
                      >
                        <Link href={`/${locale}/owners/${owner.id}`}>
                          <Eye
                            className={`${isRTL ? "ms-2" : "me-2"} h-4 w-4`}
                          />
                          {t("viewDetails")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(owner)}
                        className="cursor-pointer text-start"
                        inset={false}
                      >
                        <Edit
                          className={`${isRTL ? "ms-2" : "me-2"} h-4 w-4`}
                        />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(owner)}
                        className="text-red-600 focus:text-red-600 cursor-pointer text-start"
                        inset={false}
                      >
                        <Trash2
                          className={`${isRTL ? "ms-2" : "me-2"} h-4 w-4`}
                        />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
