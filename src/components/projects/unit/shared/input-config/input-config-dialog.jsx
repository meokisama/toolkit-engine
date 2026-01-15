import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import log from "electron-log/renderer";
// Import components
import { InputTypeSelector } from "./components/input-type-selector";
import { RlcOptionsSection } from "./components/rlc-options-section";
import { InputDetailSection } from "./components/input-detail-section";
import { LoadingSkeleton } from "./components/loading-skeleton";
import { ProjectItemDialog } from "@/components/projects/lighting/lighting-dialog";
import { AirconCardDialog } from "@/components/projects/aircon/aircon-card-dialog";
import { SceneDialog } from "@/components/projects/scenes/scene-dialog";
import { MultiSceneDialog } from "@/components/projects/multi-scenes/multi-scene-dialog";
import { SequenceDialog } from "@/components/projects/sequences/sequence-dialog";

// Import hooks
import { useRlcOptions } from "./hooks/use-rlc-options";
import { useInputDetail } from "./hooks/use-input-detail";
import { useInputType } from "./hooks/use-input-type";

// Import utilities
import { getGroupTypeLabel, getGroupTypeFromFunction } from "./utils/group-helpers";

import { useProjectDetail } from "@/contexts/project-detail-context";
import { getRlcOptionsConfig, getInputFunctionByValue } from "@/constants";

export function InputDetailConfigDialog({
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
  const { projectItems, selectedProject, loadedTabs, loadTabData, createItem } = useProjectDetail();

  // Prepare initial groups and RLC options in the correct format (before hooks)
  const initialGroupsFormatted = React.useMemo(() => {
    if (!initialGroups || !Array.isArray(initialGroups)) return [];

    // Convert to consistent format (groupId/presetBrightness)
    return initialGroups.map((group) => ({
      groupId: group.groupId ?? group.address ?? 0,
      presetBrightness: group.presetBrightness ?? group.preset ?? 255,
    }));
  }, [initialGroups]);

  const initialRlcOptionsFormatted = React.useMemo(() => {
    if (!initialRlcOptions || typeof initialRlcOptions !== "object") return {};

    // Ensure consistent property names - use individual LED fields
    return {
      ramp: initialRlcOptions.ramp ?? 0,
      preset: initialRlcOptions.preset ?? 255,
      ledDisplay: initialRlcOptions.ledDisplay ?? 0,
      nightlight: initialRlcOptions.nightlight ?? false,
      backlight: initialRlcOptions.backlight ?? false,
      autoMode: initialRlcOptions.autoMode ?? initialRlcOptions.auto_mode ?? false,
      delayOff: initialRlcOptions.delayOff ?? initialRlcOptions.delay_off ?? 0,
    };
  }, [initialRlcOptions]);

  // Use custom hooks for state management
  const { currentInputType, availableInputFunctions, currentInputFunction, isInputTypeChanging, handleInputTypeChange, resetInputType } =
    useInputType(functionValue, unitType, inputIndex, selectedProject, loadedTabs, loadTabData, open);

  const { rlcOptions, delayOffTime, handleRlcOptionChange, handleDelayOffTimeChange, resetRlcOptions, getFinalRlcOptions } =
    useRlcOptions(initialRlcOptionsFormatted);

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
    initializeDaliGroups,
  } = useInputDetail(initialGroupsFormatted, currentInputType, projectItems, selectedProject, createItem);

  // State for create/edit device dialogs
  const [createEditDialog, setCreateEditDialog] = useState({
    open: false,
    type: null, // 'lighting' or 'aircon' or other types based on currentInputType
    mode: "create", // 'create' or 'edit'
    item: null,
  });

  // Memoized custom events for better performance
  const pauseEvent = React.useMemo(
    () =>
      new CustomEvent("pauseAllAutoRefresh", {
        detail: { source: "InputDetailConfigDialog" },
      }),
    []
  );

  const resumeEvent = React.useMemo(
    () =>
      new CustomEvent("resumeAllAutoRefresh", {
        detail: { source: "InputDetailConfigDialog" },
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

  // Initialize input type when dialog opens with the passed functionValue
  // This ensures we start with the current value from the input config card
  React.useEffect(() => {
    if (open && functionValue !== null && functionValue !== undefined) {
      // Only set if different to avoid unnecessary re-renders
      if (currentInputType !== functionValue) {
        handleInputTypeChange(functionValue.toString());
      }
    }
  }, [open, functionValue, currentInputType, handleInputTypeChange]);

  // Clear all groups when input type changes (user preference)
  React.useEffect(() => {
    if (isInputTypeChanging) {
      handleClearAllGroups();
    }
  }, [isInputTypeChanging, handleClearAllGroups]);

  // Track initialGroups changes with ref to prevent infinite loops
  const initialGroupsRef = React.useRef(initialGroups);
  const hasInitialGroupsChanged = React.useMemo(() => {
    const changed = JSON.stringify(initialGroupsRef.current) !== JSON.stringify(initialGroups);
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
      initializeDaliGroups(initialGroups);
    }
  }, [open, isLoading, isInputTypeChanging, hasInitialGroupsChanged, initializeDaliGroups]);

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

    const groups = selectedGroups
      .map((group) => {
        // For network units, convert back to groupId/presetBrightness format
        if (group.groupAddress) {
          return {
            groupId: group.groupAddress,
            presetBrightness: group.preset ?? 255,
          };
        } else if (group.lightingId) {
          // Group in database - find address from lightingId
          let groupItem = availableItems.find((item) => item.id === group.lightingId);

          // Fallback to lighting items if not found in current type
          if (!groupItem) {
            groupItem = lightingItems.find((item) => item.id === group.lightingId);
          }

          const result = {
            groupId: groupItem ? parseInt(groupItem.address) : null,
            presetBrightness: group.preset ?? 255,
          };
          return result;
        }
        return null;
      })
      .filter(Boolean);

    const result = {
      groups,
      inputType: currentInputType,
      rlcOptions: finalRlcOptions,
    };

    return result;
  }, [selectedGroups, currentInputType, availableItems, lightingItems, getFinalRlcOptions]);

  // Handle save with proper callback
  const handleSave = React.useCallback(async () => {
    try {
      const saveData = getTransformedSaveData();
      await onSave(saveData);

      handleClose();
    } catch (onSaveError) {
      log.error("InputDetailConfigDialog - Error in onSave:", onSaveError);
    }
  }, [getTransformedSaveData, onSave, handleClose]);

  // Get device type based on current input type using existing logic
  const getDeviceTypeFromInputType = useCallback((inputType) => {
    return getGroupTypeFromFunction(inputType);
  }, []);

  // Handle create new item
  const handleCreateNewItem = useCallback(() => {
    const deviceType = getDeviceTypeFromInputType(currentInputType);

    setCreateEditDialog({
      open: true,
      type: deviceType,
      mode: "create",
      item: null,
    });
  }, [currentInputType, getDeviceTypeFromInputType]);

  // Handle edit item
  const handleEditItem = useCallback(
    (item) => {
      const deviceType = getDeviceTypeFromInputType(currentInputType);

      setCreateEditDialog({
        open: true,
        type: deviceType,
        mode: "edit",
        item: item,
      });
    },
    [currentInputType, getDeviceTypeFromInputType]
  );

  // Handle dialog close and refresh data
  const handleCreateEditDialogClose = useCallback(
    async (open) => {
      setCreateEditDialog((prev) => ({ ...prev, open }));

      // If dialog is closing and we have a project, refresh the data
      if (!open && selectedProject) {
        const { type } = createEditDialog;
        if (type && loadedTabs.has(type)) {
          await loadTabData(selectedProject.id, type);
        }
      }
    },
    [selectedProject, loadTabData, createEditDialog, loadedTabs]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto" aria-describedby="multi-group-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Input Detail Configuration
          </DialogTitle>
          <DialogDescription id="multi-group-description">
            {`Configure multiple ${groupTypeLabel.toLowerCase()} groups and RLC options for ${inputName}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingSkeleton />
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

            {/* Input Detail Configuration */}
            <InputDetailSection
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
              onCreateNewItem={handleCreateNewItem}
              onEditItem={handleEditItem}
            />
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

      {/* Create/Edit Lighting Dialog */}
      {createEditDialog.type === "lighting" && (
        <ProjectItemDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          category="lighting"
          item={createEditDialog.item}
          mode={createEditDialog.mode}
        />
      )}

      {/* Create/Edit Aircon Dialog */}
      {createEditDialog.type === "aircon" && (
        <AirconCardDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          mode={createEditDialog.mode}
          card={createEditDialog.item}
        />
      )}

      {/* Create/Edit Curtain Dialog */}
      {createEditDialog.type === "curtain" && (
        <ProjectItemDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          category="curtain"
          item={createEditDialog.item}
          mode={createEditDialog.mode}
        />
      )}

      {/* Create/Edit Scene Dialog */}
      {createEditDialog.type === "scene" && (
        <SceneDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          scene={createEditDialog.item}
          mode={createEditDialog.mode}
        />
      )}

      {/* Create/Edit Multi-Scene Dialog */}
      {createEditDialog.type === "multi-scene" && (
        <MultiSceneDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          multiScene={createEditDialog.item}
          mode={createEditDialog.mode}
        />
      )}

      {/* Create/Edit Sequence Dialog */}
      {createEditDialog.type === "sequence" && (
        <SequenceDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          sequence={createEditDialog.item}
          mode={createEditDialog.mode}
        />
      )}
    </Dialog>
  );
}
