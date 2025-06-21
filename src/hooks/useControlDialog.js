import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

/**
 * Optimized hook for dialog control logic
 */
export const useControlDialog = (entityConfig, unit, open) => {
  const {
    entityNameSingular,
    entityNamePlural,
    indexRange,
    apiMethods,
    filterItems,
  } = entityConfig;

  // Memoized initial states
  const initialState = useMemo(() => ({
    itemIndex: "",
    items: [],
    showItems: false,
    deletePopoverOpen: false,
  }), []);

  const initialLoadingState = useMemo(() => ({
    loading: false,
    loadingInfo: false,
    loadingAll: false,
  }), []);

  // State management
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setState(initialState);
      setLoadingState(initialLoadingState);
    }
  }, [open, initialState, initialLoadingState]);

  // Memoized validation
  const validateIndex = useCallback((value) => {
    const [minIndex, maxIndex] = indexRange;
    const numValue = parseInt(value);
    return !isNaN(numValue) && numValue >= minIndex && numValue <= maxIndex;
  }, [indexRange]);

  // Handle index input change with validation
  const handleIndexChange = useCallback((e) => {
    const value = e.target.value;
    const [minIndex, maxIndex] = indexRange;

    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= minIndex && parseInt(value) <= maxIndex)) {
      setState((prev) => ({ ...prev, itemIndex: value }));
    }
  }, [indexRange]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && state.itemIndex && validateIndex(state.itemIndex)) {
      e.preventDefault();
      handleLoadSingle();
    }
  }, [state.itemIndex, validateIndex]);

  // Load single item
  const handleLoadSingle = useCallback(async () => {
    if (!unit || !state.itemIndex) {
      toast.error(`Please enter a ${entityNameSingular.toLowerCase()} index`);
      return;
    }

    const index = parseInt(state.itemIndex);
    if (!validateIndex(state.itemIndex)) {
      const [minIndex, maxIndex] = indexRange;
      toast.error(`${entityNameSingular} index must be between ${minIndex} and ${maxIndex}`);
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingInfo: true }));
    try {
      const result = await apiMethods.loadSingle({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        index,
      });

      if (result) {
        const processedItem = apiMethods.processItem ? apiMethods.processItem(result, index) : result;
        setState((prev) => ({
          ...prev,
          items: [processedItem],
          showItems: true,
        }));
        toast.success(`${entityNameSingular} ${index} loaded successfully`);
      }
    } catch (error) {
      console.error(`Failed to load ${entityNameSingular.toLowerCase()}:`, error);
      toast.error(`Failed to load ${entityNameSingular.toLowerCase()}: ${error.message}`);
      setState((prev) => ({ ...prev, items: [], showItems: false }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingInfo: false }));
    }
  }, [unit, state.itemIndex, entityNameSingular, indexRange, apiMethods, validateIndex]);

  // Load all items
  const handleLoadAll = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingAll: true }));
    try {
      const result = await apiMethods.loadAll({
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      if (result && result.length > 0) {
        let processedItems = result;

        if (apiMethods.processItems) {
          processedItems = apiMethods.processItems(result);
        }

        if (filterItems) {
          processedItems = processedItems.filter(filterItems);
        }

        setState((prev) => ({ ...prev, items: processedItems, showItems: true }));

        if (processedItems.length > 0) {
          toast.success(`Loaded ${processedItems.length} ${entityNamePlural.toLowerCase()}`);
        } else {
          toast.info(`No valid ${entityNamePlural.toLowerCase()} found`);
        }
      } else {
        setState((prev) => ({ ...prev, items: [], showItems: true }));
        toast.info(`No ${entityNamePlural.toLowerCase()} found`);
      }
    } catch (error) {
      console.error(`Failed to load ${entityNamePlural.toLowerCase()}:`, error);
      toast.error(`Failed to load ${entityNamePlural.toLowerCase()}: ${error.message}`);
      setState((prev) => ({ ...prev, items: [], showItems: false }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingAll: false }));
    }
  }, [unit, entityNamePlural, apiMethods, filterItems]);

  // Delete item with optimistic update
  const handleDeleteFromCard = useCallback(async (itemIndex) => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    // Optimistic update
    const originalItems = state.items;
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.index !== itemIndex),
    }));

    setLoadingState((prev) => ({ ...prev, loading: true }));
    try {
      const success = await apiMethods.deleteItem({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        index: itemIndex,
      });

      if (success) {
        toast.success(`${entityNameSingular} ${itemIndex} deleted`);
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error(`Failed to delete ${entityNameSingular.toLowerCase()}:`, error);
      toast.error(`Failed to delete ${entityNameSingular.toLowerCase()}: ${error.message}`);
      // Revert optimistic update
      setState((prev) => ({ ...prev, items: originalItems }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loading: false }));
    }
  }, [unit, entityNameSingular, apiMethods, state.items]);

  return {
    state,
    loadingState,
    setState,
    setLoadingState,
    handlers: {
      handleIndexChange,
      handleKeyPress,
      handleLoadSingle,
      handleLoadAll,
      handleDeleteFromCard,
    },
  };
};
