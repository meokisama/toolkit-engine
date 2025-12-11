import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TabLoadingSkeleton() {
  return (
    <Card className="h-full">
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
          <div className="border rounded-lg">
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
            <Skeleton className="h-8 w-32" /> {/* Items per page */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8" /> {/* Previous */}
              <Skeleton className="h-8 w-8" /> {/* Page 1 */}
              <Skeleton className="h-8 w-8" /> {/* Page 2 */}
              <Skeleton className="h-8 w-8" /> {/* Next */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AirconCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" /> {/* Title */}
                <div className="space-y-2">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {/* Add placeholder card for loading state */}
        <Card className="border-dashed border-2 animate-pulse">
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
