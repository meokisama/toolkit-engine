import { useState, useCallback, useMemo } from "react";
import { updateGroupValue } from "../utils/validation-helpers";
import { createGroupByType, getAvailableItemsForFunction } from "../utils/group-helpers";

export const useInputDetail = (initialGroups = [], currentInputType, projectItems, selectedProject, createItem) => {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [usePercentage, setUsePercentage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Get available items based on current input type
  const availableItems = useMemo(() => {
    return getAvailableItemsForFunction(currentInputType, projectItems);
  }, [currentInputType, projectItems]);

  // Legacy support - keep lightingItems for backward compatibility
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems]);

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

  // Optimized available groups with early returns
  const availableGroups = useMemo(() => {
    if (!availableItems.length) return [];

    const selectedIds = new Set(selectedGroups.map((group) => group.lightingId).filter(Boolean));

    return availableItems
      .filter((item) => !selectedIds.has(item.id))
      .filter((item) => {
        if (!searchTerm) return true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const name = (item.name || "").toLowerCase();
        const address = (item.address || "").toString().toLowerCase();
        return name.includes(lowerSearchTerm) || address.includes(lowerSearchTerm);
      })
      .sort((a, b) => {
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
      setSelectedGroups((prevSelectedGroups) => {
        const groupToRemove = prevSelectedGroups[index];

        // If group has groupAddress (not in database), auto-create it when removed
        if (groupToRemove?.groupAddress) {
          // Use setTimeout to avoid blocking the state update
          setTimeout(async () => {
            try {
              const newItem = await autoCreateGroupByType(groupToRemove.groupAddress);
              if (newItem) {
                console.log(`Auto-created group ${groupToRemove.groupAddress} when removed from selected groups`);
              }
            } catch (error) {
              console.error(`Failed to auto-create group when removing:`, error);
            }
          }, 0);
        }

        return prevSelectedGroups.filter((_, i) => i !== index);
      });
    },
    [autoCreateGroupByType]
  );

  // Handle group change
  const handleGroupChange = useCallback((index, lightingId) => {
    setSelectedGroups((prev) => prev.map((group, i) => (i === index ? { ...group, lightingId } : group)));
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
  }, []);

  // Initialize groups from initial data
  const initializeDaliGroups = useCallback(
    async (initialGroups) => {
      if (!initialGroups || !Array.isArray(initialGroups)) {
        setSelectedGroups([]);
        return;
      }

      // Check if initialGroups is array format (network units with groupId/presetBrightness)
      if (initialGroups.length > 0 && initialGroups[0].hasOwnProperty("groupId")) {
        // Handle network unit format with auto-mapping
        const enhancedGroups = [];

        for (const group of initialGroups) {
          const groupAddress = group.groupId;
          if (groupAddress) {
            // Find existing group in database (based on current input type)
            // Get current availableItems without dependency
            const currentAvailableItems = getAvailableItemsForFunction(currentInputType, projectItems);
            const existingGroup = currentAvailableItems.find((item) => parseInt(item.address) === groupAddress);

            if (existingGroup) {
              // Group exists in database - add to selected groups
              enhancedGroups.push({
                lightingId: existingGroup.id,
                value: group.presetBrightness?.toString() ?? "255",
                preset: group.presetBrightness ?? 255,
                presetPercent: Math.round((group.presetBrightness / 255) * 100) || 100,
              });
            } else {
              // Group doesn't exist in database - show as "Group {address}" without combobox
              enhancedGroups.push({
                lightingId: null,
                groupAddress: groupAddress,
                value: group.presetBrightness?.toString() ?? "255",
                preset: group.presetBrightness ?? 255,
                presetPercent: Math.round((group.presetBrightness / 255) * 100) || 100,
              });
            }
          }
        }

        setSelectedGroups(enhancedGroups);
      } else {
        // Handle database unit format or empty array
        const enhancedGroups = initialGroups.map((group) => ({
          lightingId: group.lightingId,
          value: group.value ?? "100",
          preset: group.preset ?? 255,
          presetPercent: group.presetPercent ?? 100,
        }));

        setSelectedGroups(enhancedGroups);
      }
    },
    [currentInputType, projectItems]
  );

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
    handleTogglePercentage,
    resetMultipleGroups,
    initializeDaliGroups,
  };
};
