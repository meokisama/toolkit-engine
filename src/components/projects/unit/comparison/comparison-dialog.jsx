import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const CATEGORY_LABELS = {
  basic: "Basic Info",
  rs485: "RS485",
  input: "Input",
  output: "Output",
  scene: "Scenes",
  schedule: "Schedules",
  curtain: "Curtains",
  multi_scene: "Multi Scenes",
  sequence: "Sequences",
  knx: "KNX",
};

const CATEGORY_ORDER = ["basic", "rs485", "input", "output", "scene", "schedule", "curtain", "multi_scene", "sequence", "knx"];

function groupDiffsByCategory(differences) {
  const groups = {};
  differences.forEach((diff) => {
    const cat = diff.category || "basic";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(diff);
  });
  return groups;
}

function formatValue(value) {
  if (value === null || value === undefined) return <span className="text-gray-400 italic">null</span>;
  if (typeof value === "boolean") return <span className={value ? "text-green-600" : "text-red-500"}>{String(value)}</span>;
  return String(value);
}

function DiffTable({ diffs }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-muted-foreground border-b">
          <th className="text-left py-1 pr-3 font-medium w-1/2">Field</th>
          <th className="text-left py-1 pr-3 font-medium w-1/4 text-blue-600">Database</th>
          <th className="text-left py-1 font-medium w-1/4 text-orange-600">Network</th>
        </tr>
      </thead>
      <tbody>
        {diffs.map((diff, i) => (
          <tr key={i} className="border-b border-dashed border-gray-100 last:border-0">
            <td className="py-1 pr-3 text-muted-foreground font-mono">{diff.label}</td>
            <td className="py-1 pr-3 font-mono text-blue-700 bg-blue-50 rounded px-1">{formatValue(diff.dbValue)}</td>
            <td className="py-1 font-mono text-orange-700 bg-orange-50 rounded px-1">{formatValue(diff.networkValue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UnitDiffCard({ unitDiff }) {
  const groups = groupDiffsByCategory(unitDiff.differences);
  const totalCount = unitDiff.differences.length;
  const orderedCategories = CATEGORY_ORDER.filter((cat) => groups[cat]);

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{unitDiff.unitInfo}</span>
          <Badge variant="destructive">{totalCount} difference{totalCount !== 1 ? "s" : ""}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedCategories.map((cat) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {CATEGORY_LABELS[cat] || cat}
              </span>
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                {groups[cat].length}
              </Badge>
            </div>
            <DiffTable diffs={groups[cat]} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ComparisonDifferencesDialog({ open, onOpenChange, comparisonSummary }) {
  if (!comparisonSummary) return null;

  const { differentCount, errorCount, allDifferences } = comparisonSummary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Configuration Comparison Results
          </DialogTitle>
          <DialogDescription>Detailed comparison results between database units and network units</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {allDifferences.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Configuration Differences ({allDifferences.length} unit{allDifferences.length !== 1 ? "s" : ""})
              </h3>
              <ScrollArea className="h-[400px] w-full border rounded-md">
                <div className="p-4 space-y-4">
                  {allDifferences.map((unitDiff, index) => (
                    <UnitDiffCard key={index} unitDiff={unitDiff} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {allDifferences.length === 0 && differentCount === 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">All Configurations Match!</h3>
                  <p className="text-green-600">No differences found between database and network units.</p>
                </div>
              </CardContent>
            </Card>
          )}

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
                          {errorUnit.databaseUnit?.type} ({errorUnit.databaseUnit?.ip_address})
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-yellow-700">
                        {errorUnit.differences?.[0]?.label || errorUnit.differences?.[0] || "Unknown error occurred during comparison"}
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
