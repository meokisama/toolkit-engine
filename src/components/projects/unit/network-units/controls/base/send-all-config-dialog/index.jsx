import React, { useState, useCallback, useRef, memo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, CheckCircle, XCircle, Loader2, AlertTriangle, CheckSquare, Square, Info } from "lucide-react";
import { toast } from "sonner";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { NetworkUnitSelector, useNetworkUnitSelector } from "@/components/shared/network-unit-selector";
import { DatabaseUnitSelector } from "@/components/shared/database-unit-selector";
import { deleteAllConfigsFromUnits } from "../delete-all-configs-helper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import our modular functions
import { configTypeLabels, defaultConfigTypes } from "./constants";
import { validateWriteConfiguration } from "./validation";
import { writeDatabaseConfigToUnit } from "./database-write";
import { getProjectConfigurations, sendConfigToUnit } from "./project-config";

function SendAllConfigDialogComponent({ open, onOpenChange }) {
  const { selectedProject, projectItems } = useProjectDetail();
  const { selectedUnitIds, handleSelectionChange, clearSelection } = useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const databaseUnitSelectorRef = useRef(null);
  const [selectedDatabaseUnitId, setSelectedDatabaseUnitId] = useState("");
  const [selectedSourceUnitId, setSelectedSourceUnitId] = useState("all");
  const [configTypes, setConfigTypes] = useState(defaultConfigTypes);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const databaseUnits = projectItems.unit || [];

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      clearSelection();
      setSelectedDatabaseUnitId("");
      setSelectedSourceUnitId("all");
      setResults([]);
      setShowResults(false);
      setProgress(0);
      setCurrentOperation("");
      setValidationErrors([]);
    }
  }, [open, clearSelection]);

  // Handle config type toggle
  const handleConfigTypeToggle = useCallback((type, checked) => {
    setConfigTypes((prev) => ({
      ...prev,
      [type]: checked,
    }));
  }, []);

  // Handle select all config types
  const handleSelectAllConfigTypes = useCallback(() => {
    setConfigTypes(defaultConfigTypes);
  }, []);

  // Handle select none config types
  const handleSelectNoneConfigTypes = useCallback(() => {
    setConfigTypes({
      scenes: false,
      schedules: false,
      multiScenes: false,
      sequences: false,
      knx: false,
      curtain: false,
    });
  }, []);

  const handleSendConfigurations = async () => {
    // Validate write configuration if database unit is selected
    if (selectedDatabaseUnitId) {
      const errors = validateWriteConfiguration(selectedDatabaseUnitId, selectedUnitIds, databaseUnits, networkUnitSelectorRef);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
    }

    if (selectedUnitIds.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    const selectedConfigTypes = Object.entries(configTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);

    if (!selectedDatabaseUnitId && selectedConfigTypes.length === 0) {
      toast.error("Please select at least one configuration type or a database unit");
      return;
    }

    // Get selected units from NetworkUnitSelector
    const selectedUnits = networkUnitSelectorRef.current?.getSelectedUnits() || [];

    if (selectedUnits.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    setValidationErrors([]);
    setLoading(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    try {
      const operationResults = [];
      let totalOperations = 0;
      let completedOperations = 0;

      // Calculate total operations
      if (selectedDatabaseUnitId) {
        totalOperations += 1; // Database unit configuration write
      }
      if (selectedConfigTypes.length > 0) {
        // Add delete operations (one delete per unit per config type) + send operations
        totalOperations += selectedUnits.length * selectedConfigTypes.length; // Delete operations
        totalOperations += selectedUnits.length * selectedConfigTypes.length; // Send operations
      }

      // Write database unit configuration if selected
      if (selectedDatabaseUnitId) {
        const databaseUnit = databaseUnits.find((unit) => unit.id === selectedDatabaseUnitId);
        const networkUnit = selectedUnits[0]; // Only one unit should be selected when writing database config

        const writeResult = await writeDatabaseConfigToUnit(databaseUnit, networkUnit, setCurrentOperation, setProgress);

        operationResults.push({
          unit: `${networkUnit.type} (${networkUnit.ip_address})`,
          configType: "Database Configuration",
          success: writeResult.success,
          message: writeResult.success ? "Database configuration written successfully" : writeResult.error,
          count: 1,
        });

        completedOperations++;
        setProgress((completedOperations / totalOperations) * 100);
      }

      // Send project configurations if any are selected
      if (selectedConfigTypes.length > 0) {
        setCurrentOperation("Loading project configurations...");
        const configs = await getProjectConfigurations(selectedProject, configTypes, selectedSourceUnitId);

        // First, delete all existing configs from selected units
        setCurrentOperation("Deleting existing configurations...");
        const deleteResults = await deleteAllConfigsFromUnits(selectedUnits, selectedConfigTypes, (progress, message) => {
          // Calculate progress: delete operations take up first 50% of total progress
          const deleteProgress = (progress / 100) * 50;
          setProgress(deleteProgress);
          setCurrentOperation(message);
        });

        // Add delete results to operation results
        operationResults.push(...deleteResults);

        // Update completed operations to account for delete operations
        completedOperations += selectedUnits.length * selectedConfigTypes.length;

        for (const unit of selectedUnits) {
          for (const configType of selectedConfigTypes) {
            const configData = configs[configType] || [];

            if (configData.length > 0) {
              setCurrentOperation(`Sending ${configType} to ${unit.type || "Unit"} (${unit.ip_address})...`);

              const result = await sendConfigToUnit(unit, configType, configData, selectedProject);

              operationResults.push({
                unit: `${unit.type || "Unit"} (${unit.ip_address})`,
                configType,
                success: result.success,
                message: result.success ? "Sent successfully" : result.error,
                count: configData.length,
              });
            } else {
              operationResults.push({
                unit: `${unit.type || "Unit"} (${unit.ip_address})`,
                configType,
                success: true,
                message: "No items to send",
                count: 0,
              });
            }

            completedOperations++;
            // Calculate progress: send operations take up remaining 50% of progress
            const sendProgress =
              50 +
              ((completedOperations - selectedUnits.length * selectedConfigTypes.length) / (selectedUnits.length * selectedConfigTypes.length)) * 50;
            setProgress(sendProgress);
          }
        }
      }

      setResults(operationResults);
      setShowResults(true);
      setCurrentOperation("Completed");

      const successCount = operationResults.filter((r) => r.success).length;
      const totalCount = operationResults.length;

      if (successCount === totalCount) {
        toast.success(`All configurations sent successfully to ${selectedUnits.length} unit(s)`);
      } else {
        toast.warning(`${successCount}/${totalCount} operations completed successfully`);
      }
    } catch (error) {
      console.error("Failed to send configurations:", error);
      toast.error(`Failed to send configurations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Configurations
          </DialogTitle>
          <DialogDescription>
            {selectedDatabaseUnitId
              ? "Write database unit configuration and send project configurations to network unit."
              : "Send project configurations to selected network units."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Types Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Configuration Types</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllConfigTypes} disabled={loading} className="h-7 px-2 text-xs">
                    <CheckSquare className="h-4 w-4" />
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectNoneConfigTypes} disabled={loading} className="h-7 px-2 text-xs">
                    <Square className="h-4 w-4" />
                    Select None
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-6">
              {Object.entries(configTypeLabels).map(([type, { label }]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={configTypes[type]}
                    onCheckedChange={(checked) => handleConfigTypeToggle(type, checked)}
                    disabled={loading}
                  />
                  <label
                    htmlFor={type}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-2 gap-2">
              {/* Source Unit Selection */}
              <div className="flex flex-col gap-2">
                <Label>Source Unit (Group & Automation)</Label>
                <div className="space-y-2">
                  <Select value={selectedSourceUnitId} onValueChange={setSelectedSourceUnitId} disabled={loading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {databaseUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name || unit.type || "Unnamed Unit"} ({unit.ip_address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Database Unit Selection */}
              <div className="flex flex-col gap-2">
                <Label>Database Unit (RS485 & IO)</Label>
                <DatabaseUnitSelector
                  value={selectedDatabaseUnitId}
                  onValueChange={setSelectedDatabaseUnitId}
                  units={databaseUnits}
                  disabled={loading}
                  placeholder="Select a database unit"
                  ref={databaseUnitSelectorRef}
                />
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Network Units */}
          <NetworkUnitSelector
            selectedUnitIds={selectedUnitIds}
            onSelectionChange={handleSelectionChange}
            disabled={loading}
            maxSelection={selectedDatabaseUnitId ? 1 : null}
            ref={networkUnitSelectorRef}
          />

          {/* Progress */}
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{currentOperation}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {showResults && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Results</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{results.filter((r) => r.success).length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{results.filter((r) => !r.success).length}</span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[600px]" align="end">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Detailed Results</h4>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>{results.filter((r) => r.success).length}</span>
                              </div>
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>{results.filter((r) => !r.success).length}</span>
                              </div>
                            </div>
                          </div>
                          <ScrollArea className="h-96">
                            <div className="space-y-1.5 pr-3">
                              {results.map((result, index) => (
                                <div
                                  key={index}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-md ${
                                    result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                                  }`}
                                >
                                  {result.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-sm font-medium truncate">{result.unit}</span>
                                      <span className="text-xs text-muted-foreground">→</span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {configTypeLabels[result.configType]?.label || result.configType} ({result.count} items)
                                      </span>
                                    </div>
                                    {result.message && (
                                      <div
                                        className={`text-xs mt-1 ${
                                          result.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                                        }`}
                                      >
                                        {result.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            {!showResults && (
              <Button
                onClick={handleSendConfigurations}
                disabled={loading || selectedUnitIds.length === 0 || (selectedDatabaseUnitId && selectedUnitIds.length !== 1)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {selectedDatabaseUnitId ? "Writing..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {selectedDatabaseUnitId ? "Write Configuration" : "Send Configurations"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Memoized export for optimal performance
export const SendAllConfigDialog = memo(SendAllConfigDialogComponent, (prevProps, nextProps) => {
  return prevProps.open === nextProps.open && prevProps.onOpenChange === nextProps.onOpenChange;
});
