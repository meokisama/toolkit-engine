import { useState, useEffect, useMemo, useCallback } from "react";
import { getInputFunctions, getInputFunctionByValue, INPUT_TYPES } from "@/constants";
import { getTabToLoadForFunction } from "../utils/group-helpers";

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
      const uniqueTypes = allTypes.filter(
        (type, index, self) =>
          index === self.findIndex((t) => t.value === type.value)
      );

      return uniqueTypes.sort((a, b) => a.value - b.value);
    }

    // Get functions specific to this unit type and input index
    return getInputFunctions(unitType, inputIndex);
  }, [unitType, inputIndex]);

  // Get current function from available functions
  const currentInputFunction = useMemo(() => {
    if (!currentInputType || !availableInputFunctions) return null;
    return availableInputFunctions.find(
      (func) => func.value === currentInputType
    );
  }, [currentInputType, availableInputFunctions]);

  // Sync currentInputType with functionValue prop
  useEffect(() => {
    if (functionValue !== null && functionValue !== undefined) {
      setCurrentInputType(functionValue);
    }
  }, [functionValue]);

  // Reset currentInputType when dialog opens to ensure fresh state
  useEffect(() => {
    if (open && functionValue !== null && functionValue !== undefined) {
      setCurrentInputType(functionValue);
      setIsInputTypeChanging(false);
    }
  }, [open, functionValue]);

  // Ensure current input type is valid for this unit type (only on initial load)
  useEffect(() => {
    if (
      availableInputFunctions.length > 0 &&
      currentInputType !== null &&
      !isInputTypeChanging
    ) {
      const isCurrentTypeAvailable = availableInputFunctions.some(
        (func) => func.value === currentInputType
      );

      if (!isCurrentTypeAvailable) {
        console.warn(
          `Current input type ${currentInputType} not available for unit type ${unitType}. Resetting to Unused.`
        );
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

      setCurrentInputType(numValue);

      // Load required data for the new input type
      if (selectedProject && numValue) {
        await loadRequiredDataForFunction(numValue);
      }

      // Reset flag after a short delay to allow useEffect to see it
      setTimeout(() => setIsInputTypeChanging(false), 100);
    },
    [selectedProject, loadRequiredDataForFunction]
  );

  // Reset input type to initial value
  const resetInputType = useCallback(() => {
    setCurrentInputType(functionValue);
    setIsInputTypeChanging(false);
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
