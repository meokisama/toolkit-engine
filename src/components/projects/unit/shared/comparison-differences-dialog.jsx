import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

/**
 * Dialog component to display detailed comparison differences
 */
export function ComparisonDifferencesDialog({
  open,
  onOpenChange,
  comparisonSummary,
}) {
  if (!comparisonSummary) {
    return null;
  }

  const {
    totalMatches,
    identicalCount,
    differentCount,
    errorCount,
    allDifferences,
  } = comparisonSummary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Configuration Comparison Results
          </DialogTitle>
          <DialogDescription>
            Detailed comparison results between database units and network units
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMatches}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Identical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {identicalCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Different
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {differentCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {errorCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Differences Details */}
          {allDifferences.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Configuration Differences ({allDifferences.length} units)
              </h3>

              <ScrollArea className="h-[400px] w-full border rounded-md">
                <div className="p-4 space-y-4">
                  {allDifferences.map((unitDiff, index) => (
                    <Card key={index} className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{unitDiff.unitInfo}</span>
                          <Badge variant="destructive" className="ml-2">
                            {unitDiff.differences.length} differences
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {unitDiff.differences.map((diff, diffIndex) => (
                            <div
                              key={diffIndex}
                              className="flex items-start gap-2"
                            >
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0" />
                              <div className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded flex-1">
                                {diff}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* No Differences Message */}
          {allDifferences.length === 0 && differentCount === 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    All Configurations Match!
                  </h3>
                  <p className="text-green-600">
                    No differences found between database and network units.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Units */}
          {errorCount > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Units with Errors ({errorCount})
              </h3>

              <div className="space-y-2">
                {comparisonSummary.errorUnits.map((errorUnit, index) => (
                  <Card key={index} className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          {errorUnit.databaseUnit?.type} (
                          {errorUnit.databaseUnit?.ip_address})
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-yellow-700">
                        {errorUnit.differences?.[0] ||
                          "Unknown error occurred during comparison"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
