import { useState, useEffect, useMemo, useCallback } from "react";
import { getInputFunctions, INPUT_TYPES } from "@/constants";
import { getTabToLoadForFunction } from "../utils/group-helpers";
import log from "electron-log/renderer";

export const useInputType = (
  functionValue,
  unitType,
  inputIndex,
  selectedProject,
  loadedTabs,
  loadTabData,
  open = true // Add open parameter to track dialog state
) => {
  const [currentInputType, setCurrentInputType] = useState(functionValue);
  const [isInputTypeChanging, setIsInputTypeChanging] = useState(false);
  const [userHasChangedType, setUserHasChangedType] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get available input functions for the unit type and specific input index
  const availableInputFunctions = useMemo(() => {
    if (!unitType) {
      // If no unit type specified, return all available functions
      const allTypes = [];

      // Add unused option
      allTypes.push({ value: 0, label: "Unused", name: "IP_UNUSED" });

      // Add all input types from constants
      Object.values(INPUT_TYPES).forEach((categoryTypes) => {
        categoryTypes.forEach((type) => {
          allTypes.push({
            value: type.value,
            label: type.label,
            name: type.name,
          });
        });
      });

      // Remove duplicates and sort by value
      const uniqueTypes = allTypes.filter((type, index, self) => index === self.findIndex((t) => t.value === type.value));

      return uniqueTypes.sort((a, b) => a.value - b.value);
    }

    // Get functions specific to this unit type and input index
    const functions = getInputFunctions(unitType, inputIndex);
    return functions;
  }, [unitType, inputIndex]);

  // Get current function from available functions
  const currentInputFunction = useMemo(() => {
    if (!currentInputType || !availableInputFunctions) return null;
    return availableInputFunctions.find((func) => func.value === currentInputType);
  }, [currentInputType, availableInputFunctions]);

  // Sync currentInputType with functionValue prop - only update if different and user hasn't manually changed it
  useEffect(() => {
    if (functionValue !== null && functionValue !== undefined && functionValue !== currentInputType && !isInputTypeChanging && !userHasChangedType) {
      setCurrentInputType(functionValue);
    }
  }, [functionValue, currentInputType, isInputTypeChanging, userHasChangedType]);

  // Initialize state when dialog opens for the first time
  useEffect(() => {
    if (open && !hasInitialized) {
      if (functionValue !== null && functionValue !== undefined) {
        setCurrentInputType(functionValue);
      }
      setIsInputTypeChanging(false);
      setUserHasChangedType(false);
      setHasInitialized(true);
    } else if (!open) {
      // Reset initialization flag when dialog closes
      setHasInitialized(false);
    }
  }, [open, functionValue, hasInitialized]);

  // Ensure current input type is valid for this unit type (only on initial load)
  useEffect(() => {
    if (availableInputFunctions.length > 0 && currentInputType !== null && !isInputTypeChanging) {
      const isCurrentTypeAvailable = availableInputFunctions.some((func) => func.value === currentInputType);

      if (!isCurrentTypeAvailable) {
        log.warn(`Current input type ${currentInputType} not available for unit type ${unitType}. Resetting to Unused.`);
        setCurrentInputType(0); // Reset to "Unused"
      }
    }
  }, [availableInputFunctions, unitType, currentInputType, isInputTypeChanging]);

  // Load required data based on input function type
  const loadRequiredDataForFunction = useCallback(
    async (functionValue) => {
      if (!selectedProject || !functionValue) return;

      const tabToLoad = getTabToLoadForFunction(functionValue);

      // Load data if not already loaded
      if (tabToLoad && !loadedTabs.has(tabToLoad)) {
        await loadTabData(selectedProject.id, tabToLoad);
      }
    },
    [selectedProject, loadedTabs, loadTabData]
  );

  // Handle input type change
  const handleInputTypeChange = useCallback(
    async (newValue) => {
      const numValue = parseInt(newValue);

      // Set flag to indicate input type is changing
      setIsInputTypeChanging(true);
      setUserHasChangedType(true); // Mark that user has manually changed the type

      setCurrentInputType(numValue);

      // Load required data for the new input type
      if (selectedProject && numValue) {
        await loadRequiredDataForFunction(numValue);
      }

      // Reset flag after a short delay to allow useEffect to see it
      setTimeout(() => {
        setIsInputTypeChanging(false);
      }, 200);
    },
    [selectedProject, loadRequiredDataForFunction]
  );

  // Reset input type to initial value
  const resetInputType = useCallback(() => {
    setCurrentInputType(functionValue);
    setIsInputTypeChanging(false);
    setUserHasChangedType(false);
  }, [functionValue]);

  return {
    currentInputType,
    availableInputFunctions,
    currentInputFunction,
    isInputTypeChanging,
    handleInputTypeChange,
    resetInputType,
    loadRequiredDataForFunction,
  };
};
