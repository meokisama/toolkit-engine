import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { updateGroupValue } from "../utils/validation-helpers";
import { createGroupByType, getAvailableItemsForFunction } from "../utils/group-helpers";
import { toast } from "sonner";

export const useMultipleGroups = (
  initialGroups = [],
  currentInputType,
  projectItems,
  selectedProject,
  createItem
) => {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [usePercentage, setUsePercentage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Track previous input type to detect changes
  const previousInputTypeRef = useRef(currentInputType);

  // Get available items based on current input type
  const availableItems = useMemo(() => {
    return getAvailableItemsForFunction(currentInputType, projectItems);
  }, [currentInputType, projectItems]);

  // Legacy support - keep lightingItems for backward compatibility
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems]);

  // Effect to handle input type changes and clear groups when needed
  useEffect(() => {
    const previousInputType = previousInputTypeRef.current;

    // If input type changed and we have selected groups, they might be invalid for the new type
    if (previousInputType !== null && previousInputType !== currentInputType && selectedGroups.length > 0) {
      // Check if any selected groups are still valid for the new input type
      const validGroups = selectedGroups.filter(group => {
        if (group.lightingId) {
          return availableItems.some(item => item.id === group.lightingId);
        }
        return false; // Groups without lightingId (missing from database) are considered invalid
      });

      // If no groups are valid for the new input type, clear all
      if (validGroups.length === 0) {
        setSelectedGroups([]);
        // Note: Don't show toast here as it will be handled by the main dialog
      } else if (validGroups.length !== selectedGroups.length) {
        // Some groups are invalid, keep only valid ones
        const removedCount = selectedGroups.length - validGroups.length;
        setSelectedGroups(validGroups);

        // Show feedback for partially removed groups
        toast.warning(
          `${removedCount} group${removedCount > 1 ? 's' : ''} removed as they are not compatible with the new input type`,
          {
            duration: 3000,
            description: `${validGroups.length} compatible group${validGroups.length > 1 ? 's' : ''} retained`
          }
        );
      }
    }

    // Update the ref for next comparison
    previousInputTypeRef.current = currentInputType;
  }, [currentInputType, selectedGroups, availableItems]);

  // Prepare combobox options for the appropriate group type
  const groupOptions = useMemo(() => {
    return availableItems.map((item) => ({
      value: item.id.toString(),
      label: `${item.name || "Unnamed"} (${item.address})`,
    }));
  }, [availableItems]);

  // Legacy support - keep lightingOptions for backward compatibility
  const lightingOptions = useMemo(() => {
    return lightingItems.map((item) => ({
      value: item.id.toString(),
      label: `${item.name || "Unnamed"} (${item.address})`,
    }));
  }, [lightingItems]);

  // Get available groups (not yet selected)
  const availableGroups = useMemo(() => {
    const selectedIds = new Set(
      selectedGroups.map((group) => group.lightingId).filter(Boolean)
    );

    let filteredItems = availableItems.filter(
      (item) => !selectedIds.has(item.id)
    );

    // Apply search filter if search term exists
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter((item) => {
        const name = (item.name || "").toLowerCase();
        const address = (item.address || "").toString().toLowerCase();
        return (
          name.includes(lowerSearchTerm) || address.includes(lowerSearchTerm)
        );
      });
    }

    // Sort by address (ascending)
    return filteredItems.sort((a, b) => {
      const addressA = parseInt(a.address) || 0;
      const addressB = parseInt(b.address) || 0;
      return addressA - addressB;
    });
  }, [availableItems, selectedGroups, searchTerm]);

  // Auto-create missing groups in database based on input type
  const autoCreateGroupByType = useCallback(
    async (address) => {
      return await createGroupByType(address, currentInputType, selectedProject, createItem);
    },
    [currentInputType, selectedProject, createItem]
  );

  // Handle search input change
  const handleSearchInputChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  // Handle search on Enter key press
  const handleSearchKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setSearchTerm(searchInput.trim());
      }
    },
    [searchInput]
  );

  // Handle group removal
  const handleRemoveGroup = useCallback(
    async (index) => {
      const groupToRemove = selectedGroups[index];

      // If group has groupAddress (not in database), auto-create it when removed
      if (groupToRemove?.groupAddress) {
        try {
          const newItem = await autoCreateGroupByType(groupToRemove.groupAddress);
          if (newItem) {
            console.log(
              `Auto-created group ${groupToRemove.groupAddress} when removed from selected groups`
            );
            toast.success(
              `Group ${groupToRemove.groupAddress} added to database`,
              {
                duration: 3000,
                description: "Group is now available for future use"
              }
            );
          }
        } catch (error) {
          console.error(`Failed to auto-create group when removing:`, error);
          toast.error(
            `Failed to add group ${groupToRemove.groupAddress} to database`,
            {
              duration: 4000,
              description: error.message
            }
          );
        }
      }

      setSelectedGroups((prev) => prev.filter((_, i) => i !== index));
    },
    [selectedGroups, autoCreateGroupByType]
  );

  // Handle group change
  const handleGroupChange = useCallback((index, lightingId) => {
    setSelectedGroups((prev) =>
      prev.map((group, i) => (i === index ? { ...group, lightingId } : group))
    );
  }, []);

  // Handle value change
  const handleValueChange = useCallback(
    (index, value) => {
      setSelectedGroups((prev) =>
        prev.map((group, i) => {
          if (i === index) {
            return updateGroupValue(group, value, usePercentage);
          }
          return group;
        })
      );
    },
    [usePercentage]
  );

  // Add group from available list
  const handleAddFromAvailable = useCallback(
    (groupItem) => {
      const newGroup = {
        lightingId: groupItem.id,
        value: usePercentage ? "100%" : "255",
        preset: 255,
        presetPercent: 100,
      };
      setSelectedGroups((prev) => [...prev, newGroup]);
    },
    [usePercentage]
  );

  // Add all available groups
  const handleAddAllGroups = useCallback(() => {
    const newGroups = availableGroups.map((item) => ({
      lightingId: item.id,
      value: usePercentage ? "100%" : "255",
      preset: 255,
      presetPercent: 100,
    }));
    setSelectedGroups((prev) => [...prev, ...newGroups]);
  }, [availableGroups, usePercentage]);

  // Clear all groups
  const handleClearAllGroups = useCallback(() => {
    setSelectedGroups([]);
  }, []);

  // Force clear groups and reset input type tracking (used when input type changes)
  const forceClearGroups = useCallback(() => {
    setSelectedGroups([]);
    // Update the ref to current input type to prevent the effect from triggering again
    previousInputTypeRef.current = currentInputType;
  }, [currentInputType]);

  // Toggle percentage display
  const handleTogglePercentage = useCallback((checked) => {
    setUsePercentage(checked);
    // Update display values for all groups
    setSelectedGroups((prev) =>
      prev.map((group) => ({
        ...group,
        value: checked ? `${group.presetPercent}%` : group.preset.toString(),
      }))
    );
  }, []);

  // Reset all state
  const resetMultipleGroups = useCallback(() => {
    setSelectedGroups([]);
    setUsePercentage(false);
    setSearchTerm("");
    setSearchInput("");
    // Reset the previous input type ref when resetting
    previousInputTypeRef.current = null;
  }, []);

  // Initialize groups from initial data
  const initializeGroups = useCallback(async (initialGroups, forceReinit = false) => {
    if (!initialGroups || !Array.isArray(initialGroups)) {
      setSelectedGroups([]);
      return;
    }

    // Don't reinitialize if we already have groups and it's not forced
    // This prevents clearing groups when input type changes
    if (!forceReinit && selectedGroups.length > 0) {
      return;
    }

    // Check if initialGroups is array format (network units with groupId/presetBrightness)
    if (
      initialGroups.length > 0 &&
      initialGroups[0].hasOwnProperty("groupId")
    ) {
      // Handle network unit format with auto-mapping
      const enhancedGroups = [];

      for (const group of initialGroups) {
        const groupAddress = group.groupId;
        if (groupAddress) {
          // Find existing group in database (based on current input type)
          const existingGroup = availableItems.find(
            (item) => parseInt(item.address) === groupAddress
          );

          if (existingGroup) {
            // Group exists in database - add to selected groups
            enhancedGroups.push({
              lightingId: existingGroup.id,
              value: group.presetBrightness?.toString() || "255",
              preset: group.presetBrightness || 255,
              presetPercent:
                Math.round((group.presetBrightness / 255) * 100) || 100,
            });
          } else {
            // Group doesn't exist in database - show as "Group {address}" without combobox
            enhancedGroups.push({
              lightingId: null,
              groupAddress: groupAddress,
              value: group.presetBrightness?.toString() || "255",
              preset: group.presetBrightness || 255,
              presetPercent:
                Math.round((group.presetBrightness / 255) * 100) || 100,
            });
          }
        }
      }

      setSelectedGroups(enhancedGroups);
    } else {
      // Handle database unit format or empty array
      const enhancedGroups = initialGroups.map((group) => ({
        lightingId: group.lightingId,
        value: group.value || "100",
        preset: group.preset || 255,
        presetPercent: group.presetPercent || 100,
      }));

      setSelectedGroups(enhancedGroups);
    }
  }, [availableItems, selectedGroups.length]);

  return {
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
    forceClearGroups,
    handleTogglePercentage,
    resetMultipleGroups,
    initializeGroups,
  };
};
