import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="flex items-center space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4 p-4 border-b border-muted">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DataTableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" /> {/* Search input */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-20" /> {/* Add button */}
          <Skeleton className="h-10 w-24" /> {/* Bulk delete button */}
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="flex items-center space-x-4 p-4 border-b bg-muted/50">
          <Skeleton className="h-4 w-4" /> {/* Checkbox */}
          <Skeleton className="h-4 w-24" /> {/* Name */}
          <Skeleton className="h-4 w-20" /> {/* Address */}
          <Skeleton className="h-4 w-32" /> {/* Description */}
          <Skeleton className="h-4 w-16" /> {/* Actions */}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border-b">
            <Skeleton className="h-4 w-4" /> {/* Checkbox */}
            <Skeleton className="h-4 w-24" /> {/* Name */}
            <Skeleton className="h-4 w-20" /> {/* Address */}
            <Skeleton className="h-4 w-32" /> {/* Description */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8" /> {/* Edit */}
              <Skeleton className="h-8 w-8" /> {/* Duplicate */}
              <Skeleton className="h-8 w-8" /> {/* Delete */}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" /> {/* Selected count */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" /> {/* Previous */}
          <Skeleton className="h-8 w-8" /> {/* Page number */}
          <Skeleton className="h-8 w-20" /> {/* Next */}
        </div>
      </div>
    </div>
  );
}
