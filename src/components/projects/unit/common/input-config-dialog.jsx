import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

// Import components
import { InputTypeSelector } from "./input-config-dialog/components/input-type-selector";
import { RlcOptionsSection } from "./input-config-dialog/components/rlc-options-section";
import { MultipleGroupsSection } from "./input-config-dialog/components/multiple-groups-section";
import { LoadingSkeleton } from "./input-config-dialog/components/loading-skeleton";

// Import hooks
import { useRlcOptions } from "./input-config-dialog/hooks/use-rlc-options";
import { useMultipleGroups } from "./input-config-dialog/hooks/use-multiple-groups";
import { useInputType } from "./input-config-dialog/hooks/use-input-type";

// Import utilities
import { getGroupTypeLabel } from "./input-config-dialog/utils/group-helpers";

import { useProjectDetail } from "@/contexts/project-detail-context";
import { getRlcOptionsConfig, getInputFunctionByValue } from "@/constants";
import { Separator } from "@/components/ui/separator";

export function MultiGroupConfigDialog({
  open,
  onOpenChange,
  inputName = "",
  functionName = "",
  functionValue = null,
  unitType = null,
  inputIndex = 0,
  initialGroups = [],
  initialRlcOptions = {},
  isLoading = false,
  onSave = () => {},
}) {
  const { projectItems, selectedProject, loadedTabs, loadTabData, createItem } =
    useProjectDetail();

  // Prepare initial groups and RLC options in the correct format (before hooks)
  const initialGroupsFormatted = React.useMemo(() => {
    if (!initialGroups || !Array.isArray(initialGroups)) return [];

    // Convert to consistent format (groupId/presetBrightness)
    return initialGroups.map((group) => ({
      groupId: group.groupId || group.address || 0,
      presetBrightness: group.presetBrightness || group.preset || 255,
    }));
  }, [initialGroups]);

  const initialRlcOptionsFormatted = React.useMemo(() => {
    if (!initialRlcOptions || typeof initialRlcOptions !== "object") return {};

    // Ensure consistent property names
    return {
      ramp: initialRlcOptions.ramp || 0,
      preset: initialRlcOptions.preset || 100,
      ledStatus:
        initialRlcOptions.ledStatus || initialRlcOptions.led_status || 0,
      autoMode: initialRlcOptions.autoMode || initialRlcOptions.auto_mode || 0,
      delayOff: initialRlcOptions.delayOff || initialRlcOptions.delay_off || 0,
      delayOn: initialRlcOptions.delayOn || initialRlcOptions.delay_on || 0,
    };
  }, [initialRlcOptions]);

  // Use custom hooks for state management
  const {
    currentInputType,
    availableInputFunctions,
    currentInputFunction,
    isInputTypeChanging,
    handleInputTypeChange,
    resetInputType,
  } = useInputType(
    functionValue,
    unitType,
    inputIndex,
    selectedProject,
    loadedTabs,
    loadTabData,
    open
  );

  const {
    rlcOptions,
    delayOffTime,
    handleRlcOptionChange,
    handleDelayOffTimeChange,
    resetRlcOptions,
    getFinalRlcOptions,
  } = useRlcOptions(initialRlcOptionsFormatted);

  const {
    selectedGroups,
    availableGroups,
    availableItems,
    lightingItems,
    groupOptions,
    lightingOptions,
    usePercentage,
    searchTerm,
    searchInput,
    handleSearchInputChange,
    handleSearchKeyPress,
    handleRemoveGroup,
    handleGroupChange,
    handleValueChange,
    handleAddFromAvailable,
    handleAddAllGroups,
    handleClearAllGroups,
    handleTogglePercentage,
    resetMultipleGroups,
    initializeGroups,
  } = useMultipleGroups(
    initialGroupsFormatted,
    currentInputType,
    projectItems,
    selectedProject,
    createItem
  );

  // Memoized custom events for better performance
  const pauseEvent = React.useMemo(
    () =>
      new CustomEvent("pauseAllAutoRefresh", {
        detail: { source: "MultiGroupConfigDialog" },
      }),
    []
  );

  const resumeEvent = React.useMemo(
    () =>
      new CustomEvent("resumeAllAutoRefresh", {
        detail: { source: "MultiGroupConfigDialog" },
      }),
    []
  );

  // Effect to pause all auto refresh when this dialog is open
  React.useEffect(() => {
    if (open) {
      window.dispatchEvent(pauseEvent);
    } else {
      window.dispatchEvent(resumeEvent);
    }
  }, [open, pauseEvent, resumeEvent]);

  // Get group type label for UI display (simple function call doesn't need memoization)
  const groupTypeLabel = getGroupTypeLabel(currentInputType);

  // Determine which RLC options should be enabled based on function
  const rlcOptionsConfig = React.useMemo(() => {
    if (currentInputType !== null) {
      const inputFunction = getInputFunctionByValue(currentInputType);
      if (inputFunction) {
        return getRlcOptionsConfig(inputFunction.name, unitType);
      }
    }
    // Default configuration if no function is specified
    return getRlcOptionsConfig(null, unitType);
  }, [currentInputType, unitType]);

  // Check if current function is a multiple group function
  const isMultipleGroupFunction = React.useMemo(() => {
    if (currentInputType !== null) {
      const inputFunction = getInputFunctionByValue(currentInputType);
      if (inputFunction) {
        return rlcOptionsConfig.multiGroupEnabled;
      }
    }
    return false;
  }, [currentInputType, rlcOptionsConfig.multiGroupEnabled]);

  // Reset input type when dialog opens to ensure fresh state
  React.useEffect(() => {
    if (open) {
      resetInputType();
    }
  }, [open, resetInputType]);

  // Clear all groups when input type changes (user preference)
  React.useEffect(() => {
    if (isInputTypeChanging) {
      handleClearAllGroups();
    }
  }, [isInputTypeChanging, handleClearAllGroups]);

  // Track initialGroups changes with ref to prevent infinite loops
  const initialGroupsRef = React.useRef(initialGroups);
  const hasInitialGroupsChanged = React.useMemo(() => {
    const changed =
      JSON.stringify(initialGroupsRef.current) !==
      JSON.stringify(initialGroups);
    if (changed) {
      initialGroupsRef.current = initialGroups;
    }
    return changed;
  }, [initialGroups]);

  // Initialize groups when dialog opens or input type changes
  React.useEffect(() => {
    if (
      open &&
      !isLoading &&
      !isInputTypeChanging &&
      initialGroups !== null &&
      initialGroups !== undefined &&
      (hasInitialGroupsChanged || initialGroupsRef.current === null)
    ) {
      initializeGroups(initialGroups);
    }
  }, [
    open,
    isLoading,
    isInputTypeChanging,
    hasInitialGroupsChanged,
    initializeGroups,
  ]);

  // Handle dialog close
  const handleClose = React.useCallback(() => {
    resetMultipleGroups();
    resetRlcOptions();
    resetInputType();
    onOpenChange(false);
  }, [resetMultipleGroups, resetRlcOptions, resetInputType, onOpenChange]);

  // Transform save data using callback to avoid stale closure issues
  const getTransformedSaveData = React.useCallback(() => {
    const finalRlcOptions = getFinalRlcOptions();

    const groups = isMultipleGroupFunction
      ? selectedGroups
          .map((group) => {
            // For network units, convert back to groupId/presetBrightness format
            if (group.groupAddress) {
              return {
                groupId: group.groupAddress,
                presetBrightness: group.preset || 255,
              };
            } else if (group.lightingId) {
              // Group in database - find address from lightingId
              let groupItem = availableItems.find(
                (item) => item.id === group.lightingId
              );

              // Fallback to lighting items if not found in current type
              if (!groupItem) {
                groupItem = lightingItems.find(
                  (item) => item.id === group.lightingId
                );
              }

              const result = {
                groupId: groupItem ? parseInt(groupItem.address) : null,
                presetBrightness: group.preset || 255,
              };
              return result;
            }
            return null;
          })
          .filter(Boolean)
      : [];

    const result = {
      groups,
      inputType: currentInputType,
      rlcOptions: finalRlcOptions,
    };

    return result;
  }, [
    selectedGroups,
    currentInputType,
    isMultipleGroupFunction,
    availableItems,
    lightingItems,
    getFinalRlcOptions,
  ]);

  // Handle save with proper callback
  const handleSave = React.useCallback(async () => {
    try {
      const saveData = getTransformedSaveData();
      await onSave(saveData);

      handleClose();
    } catch (onSaveError) {
      console.error("MultiGroupConfigDialog - Error in onSave:", onSaveError);
    }
  }, [getTransformedSaveData, onSave, handleClose]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="sm:max-w-6xl max-h-[95vh] overflow-y-auto"
        aria-describedby="multi-group-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isMultipleGroupFunction
              ? "Multiple Group & RLC Configuration"
              : "RLC Configuration"}
          </DialogTitle>
          <DialogDescription id="multi-group-description">
            {isMultipleGroupFunction
              ? `Configure multiple ${groupTypeLabel.toLowerCase()} groups and RLC options for ${inputName}`
              : `Configure RLC options for ${inputName}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingSkeleton isMultipleGroupFunction={isMultipleGroupFunction} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* Input Type Selection */}
              <InputTypeSelector
                currentInputType={currentInputType}
                availableInputFunctions={availableInputFunctions}
                currentInputFunction={currentInputFunction}
                inputIndex={inputIndex}
                unitType={unitType}
                onInputTypeChange={handleInputTypeChange}
              />

              {/* RLC Options Section */}
              <RlcOptionsSection
                rlcOptions={rlcOptions}
                rlcOptionsConfig={rlcOptionsConfig}
                delayOffTime={delayOffTime}
                onRlcOptionChange={handleRlcOptionChange}
                onDelayOffTimeChange={handleDelayOffTimeChange}
              />
            </div>

            {/* Multiple Groups Configuration - Only show for multiple group functions */}
            {isMultipleGroupFunction && (
              <MultipleGroupsSection
                selectedGroups={selectedGroups}
                availableGroups={availableGroups}
                availableItems={availableItems}
                lightingItems={lightingItems}
                groupOptions={groupOptions}
                lightingOptions={lightingOptions}
                groupTypeLabel={groupTypeLabel}
                usePercentage={usePercentage}
                searchInput={searchInput}
                searchTerm={searchTerm}
                onTogglePercentage={handleTogglePercentage}
                onGroupChange={handleGroupChange}
                onValueChange={handleValueChange}
                onRemoveGroup={handleRemoveGroup}
                onAddFromAvailable={handleAddFromAvailable}
                onAddAllGroups={handleAddAllGroups}
                onClearAllGroups={handleClearAllGroups}
                onSearchInputChange={handleSearchInputChange}
                onSearchKeyPress={handleSearchKeyPress}
              />
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
