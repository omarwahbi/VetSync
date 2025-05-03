"use client";

import { useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useOwners, Owner, PAGE_SIZES } from "@/hooks/useOwners";
import { useOwnerMutations, OwnerFormValues } from "@/hooks/useOwnerMutations";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  OwnersTable,
  OwnerColumnVisibility,
} from "@/components/owners/OwnersTable";
import { OwnersTableSkeleton } from "@/components/owners/OwnersTableSkeleton";
import { OwnersSearchFilter } from "@/components/owners/OwnersSearchFilter";
import { OwnersColumnSelector } from "@/components/owners/OwnersColumnSelector";
import { SimplePagination } from "@/components/owners/SimplePagination";
import { OwnersEmptyState } from "@/components/owners/OwnersEmptyState";
import {
  AddOwnerDialog,
  EditOwnerDialog,
  DeleteOwnerDialog,
} from "@/components/owners/OwnerDialogs";
import { NewClientWizard } from "@/components/wizards/new-client-wizard";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function OwnersClient() {
  const t = useTranslations("Owners");
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const locale = params.locale as string;

  // Get everything we need from the hook
  const {
    owners,
    meta,
    isLoading,
    error,
    isError,
    searchTerm,
    setSearchTerm,
    page,
    limit,
    setLimit,
    clearFilters,
    hasActiveFilters,
    refetch,
    setPage,
  } = useOwners();

  // Mutations from useOwnerMutations hook
  const {
    createOwner,
    isCreating,
    updateOwner,
    isUpdatingOwner,
    deleteOwner,
    isDeletingOwner,
  } = useOwnerMutations();

  // Local state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [deletingOwner, setDeletingOwner] = useState<Owner | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Column visibility state
  const [columnsVisibility, setColumnsVisibility] =
    useState<OwnerColumnVisibility>({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      reminders: true,
      createdBy: false,
      updatedBy: false,
      actions: true,
    });

  // Function to toggle column visibility
  const toggleColumn = (column: keyof OwnerColumnVisibility) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Handle create owner
  const handleCreateOwner = (data: OwnerFormValues) => {
    createOwner(data);
    setIsAddDialogOpen(false);
  };

  // Handle edit owner
  const handleEditClick = (owner: Owner) => {
    setEditingOwner(owner);
    setIsEditDialogOpen(true);
  };

  // Handle update owner
  const handleUpdateOwner = (data: OwnerFormValues) => {
    if (!editingOwner) {
      return;
    }
    updateOwner({
      id: editingOwner.id,
      updateData: data,
    });
  };

  // Handle delete owner
  const handleDeleteClick = (owner: Owner) => {
    setDeletingOwner(owner);
  };

  // Confirm delete owner
  const confirmDeleteOwner = () => {
    if (!deletingOwner) {
      return;
    }
    deleteOwner(deletingOwner.id);
    setDeletingOwner(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{t("clientList")}</CardTitle>
          <div className="flex items-center gap-2">
            <OwnersColumnSelector
              columnsVisibility={columnsVisibility}
              onToggleColumn={toggleColumn}
            />
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("newClient")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search input */}
          <OwnersSearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            hasActiveFilters={!!hasActiveFilters}
            onClearFilters={clearFilters}
            totalCount={meta?.totalCount}
          />

          {isLoading ? (
            <OwnersTableSkeleton columnsVisibility={columnsVisibility} />
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                {t("errorLoading")}{" "}
                {(error as Error)?.message || t("unknownError")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCcw className="me-2 h-4 w-4" />
                {t("retry")}
              </Button>
            </div>
          ) : owners && owners.length > 0 ? (
            <>
              <OwnersTable
                owners={owners}
                columnsVisibility={columnsVisibility}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                meta={meta}
              />

              {/* Pagination Controls with Page Size Selector */}
              {meta && meta.totalPages > 0 && (
                <div className="px-6 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <p className="text-sm font-medium">{t("rowsPerPage")}</p>
                      <Select
                        value={`${limit}`}
                        onValueChange={(value: string) => {
                          setLimit(Number(value));
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={limit.toString()} />
                        </SelectTrigger>
                        <SelectContent className="min-w-[70px]">
                          {PAGE_SIZES.map((size) => (
                            <SelectItem
                              key={size}
                              value={`${size}`}
                              className="text-center"
                            >
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <SimplePagination
                      currentPage={page}
                      totalPages={meta.totalPages}
                      onPageChange={setPage}
                      totalCount={meta.totalCount || 0}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <OwnersEmptyState
              hasFilters={!!hasActiveFilters}
              onReset={clearFilters}
              onCreateNew={() => setIsWizardOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Owner Dialog */}
      <AddOwnerDialog
        isOpen={isAddDialogOpen}
        isLoading={isCreating}
        onSubmit={handleCreateOwner}
        onClose={() => setIsAddDialogOpen(false)}
      />

      {/* Edit Owner Dialog */}
      {editingOwner && (
        <EditOwnerDialog
          isOpen={isEditDialogOpen}
          isLoading={isUpdatingOwner}
          owner={editingOwner}
          onSubmit={handleUpdateOwner}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingOwner(null);
          }}
        />
      )}

      {/* Delete Owner Dialog */}
      {deletingOwner && (
        <DeleteOwnerDialog
          owner={deletingOwner}
          isLoading={isDeletingOwner}
          onConfirm={confirmDeleteOwner}
          onClose={() => setDeletingOwner(null)}
        />
      )}

      {/* New Client Wizard */}
      {isWizardOpen && (
        <NewClientWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
        />
      )}
    </div>
  );
}
