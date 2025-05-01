import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { OwnerColumnVisibility } from "./OwnersTable";

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

interface OwnersTableSkeletonProps {
  columnsVisibility: OwnerColumnVisibility;
  rowCount?: number;
}

export const OwnersTableSkeleton: React.FC<OwnersTableSkeletonProps> = ({
  columnsVisibility,
  rowCount = 5,
}) => {
  return (
    <div className="w-full overflow-hidden">
      <Table className="w-full">
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-muted/50">
            {columnsVisibility.firstName && (
              <TableHead className="font-medium">First Name</TableHead>
            )}
            {columnsVisibility.lastName && (
              <TableHead className="font-medium">Last Name</TableHead>
            )}
            {columnsVisibility.email && (
              <TableHead className="font-medium">Email</TableHead>
            )}
            {columnsVisibility.phone && (
              <TableHead className="font-medium">Phone</TableHead>
            )}
            {columnsVisibility.reminders && (
              <TableHead className="font-medium">Reminders</TableHead>
            )}
            {columnsVisibility.createdBy && (
              <TableHead className="font-medium">Created By</TableHead>
            )}
            {columnsVisibility.updatedBy && (
              <TableHead className="font-medium">Updated By</TableHead>
            )}
            {columnsVisibility.actions && (
              <TableHead className="text-center font-medium w-20">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y">
          {Array.from({ length: rowCount }).map((_, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              {columnsVisibility.firstName && (
                <TableCell className="font-medium">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              )}
              {columnsVisibility.lastName && (
                <TableCell className="text-muted-foreground">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              )}
              {columnsVisibility.email && (
                <TableCell className="text-muted-foreground">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
              )}
              {columnsVisibility.phone && (
                <TableCell className="text-muted-foreground">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
              )}
              {columnsVisibility.reminders && (
                <TableCell className="text-muted-foreground">
                  <Skeleton className="h-5 w-16" />
                </TableCell>
              )}
              {columnsVisibility.createdBy && (
                <TableCell className="text-muted-foreground">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              )}
              {columnsVisibility.updatedBy && (
                <TableCell className="text-muted-foreground">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              )}
              {columnsVisibility.actions && (
                <TableCell className="text-center">
                  <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
