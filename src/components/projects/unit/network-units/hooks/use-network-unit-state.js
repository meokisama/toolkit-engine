import { useState, useRef } from "react";
import { useDialogState } from "./use-dialog-state";

export function useNetworkUnitState() {
  // Cache for newly created items during this transfer session
  const createdItemsCache = useRef({
    aircon: new Map(), // address -> item
    lighting: new Map(), // address -> item
  });

  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedNetworkUnits, setSelectedNetworkUnits] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [networkTable, setNetworkTable] = useState(null);

  // Use consolidated dialog state management
  const dialogState = useDialogState();

  return {
    // Cache
    createdItemsCache,

    // Network units state
    networkUnits,
    setNetworkUnits,
    selectedNetworkUnits,
    setSelectedNetworkUnits,
    scanLoading,
    setScanLoading,
    networkTable,
    setNetworkTable,

    // Dialog state management (replaces 12+ individual states)
    dialogState,
  };
}
