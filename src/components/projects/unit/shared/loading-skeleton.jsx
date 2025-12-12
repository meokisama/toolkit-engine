import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Input Configuration Skeleton - Left Side */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-16 ml-auto" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="space-y-3 pr-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg flex gap-4 justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Output Configuration Skeleton - Right Side */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-16 ml-auto" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="space-y-3 pr-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg flex gap-4 justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-56" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
