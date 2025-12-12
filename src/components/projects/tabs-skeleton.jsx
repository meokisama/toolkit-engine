import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TabContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Tabs skeleton */}
      <div className="flex space-x-1 w-full">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-1/5" />
        ))}
      </div>

      {/* Tab content skeleton */}
      <Card className="flex-1 mt-2">
        <CardContent className="h-full">
          <div className="space-y-4 pt-6">
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
              {Array.from({ length: 5 }).map((_, index) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
