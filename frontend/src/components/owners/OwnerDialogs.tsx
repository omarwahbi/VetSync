import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Owner } from "@/hooks/useOwners";
import { OwnerFormValues } from "@/hooks/useOwnerMutations";
import { OwnerForm } from "@/components/forms/owner-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Add Owner Dialog
interface AddOwnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OwnerFormValues) => void;
  isLoading: boolean;
}

export const AddOwnerDialog: React.FC<AddOwnerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const t = useTranslations("Owners");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl">{t("addOwner")}</DialogTitle>
        </DialogHeader>
        <OwnerForm
          onSubmit={onSubmit}
          onClose={onClose}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

// Edit Owner Dialog
interface EditOwnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  owner: Owner | null;
  onSubmit: (data: OwnerFormValues) => void;
  isLoading: boolean;
}

export const EditOwnerDialog: React.FC<EditOwnerDialogProps> = ({
  isOpen,
  onClose,
  owner,
  onSubmit,
  isLoading,
}) => {
  const t = useTranslations("Owners");

  if (!owner) return null;

  const initialData = {
    firstName: owner.firstName,
    lastName: owner.lastName,
    phone: owner.phone,
    email: owner.email ?? undefined,
    address: owner.address || "",
    allowAutomatedReminders: owner.allowAutomatedReminders,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl">{t("editOwner")}</DialogTitle>
        </DialogHeader>
        <OwnerForm
          initialData={initialData}
          onSubmit={onSubmit}
          onClose={onClose}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

// Delete Owner Dialog
interface DeleteOwnerDialogProps {
  owner: Owner | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const DeleteOwnerDialog: React.FC<DeleteOwnerDialogProps> = ({
  owner,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const t = useTranslations("Owners");

  if (!owner) return null;

  return (
    <AlertDialog open={!!owner} onOpenChange={onClose}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDeleteOwner")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("ownerDeleteWarning")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("delete")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
