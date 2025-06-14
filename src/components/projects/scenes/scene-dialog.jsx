import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectDetail } from "@/contexts/project-detail-context";
import {
  OBJECT_TYPES,
  AC_POWER_VALUES,
  AC_FAN_SPEED_VALUES,
  AC_MODE_VALUES,
  AC_SWING_VALUES,
  AC_POWER_LABELS,
  AC_FAN_SPEED_LABELS,
  AC_MODE_LABELS,
  AC_SWING_LABELS,
  CURTAIN_VALUE_LABELS,
  AIRCON_OBJECT_LABELS,
} from "@/constants";
import {
  Plus,
  Trash2,
  Lightbulb,
  Wind,
  Blinds,
  Network,
  Sun,
  Edit,
} from "lucide-react";
import { AirconPropertiesDialog } from "./aircon-properties-dialog";
import { toast } from "sonner";

export function SceneDialog({
  open,
  onOpenChange,
  scene = null,
  mode = "create",
}) {
  const {
    selectedProject,
    projectItems,
    createItem,
    updateItem,
    setActiveTab,
    loadTabData,
    loadedTabs,
  } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [sceneItems, setSceneItems] = useState([]);
  const [originalSceneItems, setOriginalSceneItems] = useState([]); // Store original items for reset
  const [loading, setLoading] = useState(false);
  const [airconPropertiesDialog, setAirconPropertiesDialog] = useState({
    open: false,
    airconCard: null,
  });
  const [editAirconPropertiesDialog, setEditAirconPropertiesDialog] = useState({
    open: false,
    airconGroup: null,
  });
  const [usedItemsByAddress, setUsedItemsByAddress] = useState([]); // Store items used by other scenes with same address

  // Debounce timer for validation
  const validationTimeoutRef = useRef(null);

  // Validate address field - memoized
  const validateAddress = useCallback((value) => {
    if (!value.trim()) {
      return "Address is required for scenes"; // Address is now required for scenes
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
      return "Address must be an integer";
    }

    if (num < 1 || num > 255) {
      return "Address must be between 1 and 255";
    }

    return null;
  }, []);

  // Validate name field - memoized
  const validateName = useCallback((value) => {
    if (!value.trim()) {
      return "Name is required";
    }

    if (value.length > 15) {
      return "Name must be 15 characters or less";
    }

    return null;
  }, []);

  const loadSceneItems = useCallback(async (sceneId) => {
    try {
      const items = await window.electronAPI.scene.getItemsWithDetails(sceneId);
      setSceneItems(items);
      setOriginalSceneItems(items); // Store original items for reset
    } catch (error) {
      console.error("Failed to load scene items:", error);
    }
  }, []);

  // Load items used by other scenes with the same address
  const loadUsedItemsByAddress = useCallback(
    async (address) => {
      if (!address || !address.trim() || !selectedProject) {
        setUsedItemsByAddress([]);
        return;
      }

      try {
        const usedItems = await window.electronAPI.scene.getAddressItems(
          selectedProject.id,
          address
        );
        setUsedItemsByAddress(usedItems);
      } catch (error) {
        console.error("Failed to load used items by address:", error);
        setUsedItemsByAddress([]);
      }
    },
    [selectedProject]
  );

  useEffect(() => {
    if (open) {
      if (mode === "edit" && scene) {
        setFormData({
          name: scene.name || "",
          address: scene.address || "",
          description: scene.description || "",
        });
        loadSceneItems(scene.id);
        // Load used items for the current address
        if (scene.address) {
          loadUsedItemsByAddress(scene.address);
        }
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
        });
        setSceneItems([]);
        setOriginalSceneItems([]);
        setUsedItemsByAddress([]);
      }
      setErrors({});

      // Load required data for scene dialog if not already loaded
      if (selectedProject) {
        // Load aircon data if not already loaded
        if (!loadedTabs.has("aircon")) {
          loadTabData(selectedProject.id, "aircon");
        }
        // Load curtain data if not already loaded
        if (!loadedTabs.has("curtain")) {
          loadTabData(selectedProject.id, "curtain");
        }
        // Load lighting data if not already loaded
        if (!loadedTabs.has("lighting")) {
          loadTabData(selectedProject.id, "lighting");
        }
        // Load KNX data if not already loaded
        if (!loadedTabs.has("knx")) {
          loadTabData(selectedProject.id, "knx");
        }
      }
    }
  }, [
    open,
    mode,
    scene,
    selectedProject,
    loadedTabs,
    loadTabData,
    loadSceneItems,
    loadUsedItemsByAddress,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear general error when user starts typing
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors.general) {
          delete newErrors.general;
        }

        // Clear field error immediately when user starts typing
        if (newErrors[field]) {
          delete newErrors[field];
        }

        return newErrors;
      });

      // Debounced validation for address field to prevent lag
      if (field === "address") {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }

        validationTimeoutRef.current = setTimeout(() => {
          const error = validateAddress(value);
          setErrors((prev) => ({ ...prev, address: error }));

          // Load used items by address after validation
          if (!error && value.trim()) {
            loadUsedItemsByAddress(value.trim());
          } else {
            setUsedItemsByAddress([]);
          }
        }, 300); // 300ms debounce
      }
    },
    [validateAddress, loadUsedItemsByAddress]
  );

  // Memoize getItemDetails to prevent unnecessary recalculations
  const getItemDetails = useMemo(() => {
    return (itemType, itemId) => {
      const items = projectItems[itemType] || [];
      return items.find((item) => item.id === itemId);
    };
  }, [projectItems]);

  const getCommandForAirconItem = useCallback((objectType, itemValue) => {
    // For aircon items, we need to find the command based on object_type and value
    switch (objectType) {
      case OBJECT_TYPES.AC_POWER.obj_name:
        return (
          Object.entries(AC_POWER_VALUES).find(
            ([, value]) => value.toString() === itemValue
          )?.[0] || null
        );
      case OBJECT_TYPES.AC_FAN_SPEED.obj_name:
        return (
          Object.entries(AC_FAN_SPEED_VALUES).find(
            ([, value]) => value.toString() === itemValue
          )?.[0] || null
        );
      case OBJECT_TYPES.AC_MODE.obj_name:
        return (
          Object.entries(AC_MODE_VALUES).find(
            ([, value]) => value.toString() === itemValue
          )?.[0] || null
        );
      case OBJECT_TYPES.AC_SWING.obj_name:
        return (
          Object.entries(AC_SWING_VALUES).find(
            ([, value]) => value.toString() === itemValue
          )?.[0] || null
        );
      case OBJECT_TYPES.AC_TEMPERATURE.obj_name:
        return null; // Temperature doesn't use commands, just direct value
      default:
        return null;
    }
  }, []);

  const addItemToScene = useCallback(
    async (itemType, itemId, itemValue = null) => {
      const item = getItemDetails(itemType, itemId);
      if (!item) return;

      // Get command and object_type for the item
      let command = null;
      let objectType = item.object_type;

      // For aircon items, get the command based on object_type and value
      if (itemType === "aircon" && itemValue !== null) {
        command = getCommandForAirconItem(item.object_type, itemValue);
      }

      // Check if this item can be added (not already used by another scene with same address)
      if (formData.address && selectedProject) {
        try {
          const canAdd = await window.electronAPI.scene.canAddItemToScene(
            selectedProject.id,
            formData.address,
            itemType,
            itemId,
            objectType,
            mode === "edit" && scene ? scene.id : null // Exclude current scene when editing
          );

          if (!canAdd) {
            toast.error(
              `This item is already used by another scene with address ${formData.address}`
            );
            return;
          }
        } catch (error) {
          console.error("Failed to check if item can be added:", error);
          // Continue with adding if check fails
        }
      }

      // Always add to local state only - changes will be saved when user clicks Save
      const newSceneItem = {
        id: mode === "edit" ? `temp_${Date.now()}` : Date.now(), // Temporary ID
        item_type: itemType,
        item_id: itemId,
        item_value: itemValue,
        command: command,
        object_type: objectType,
        item_name: item.name,
        item_address: item.address,
        item_description: item.description,
        label: item.label, // Include label for aircon items
      };
      setSceneItems((prev) => [...prev, newSceneItem]);
    },
    [
      getItemDetails,
      getCommandForAirconItem,
      mode,
      formData.address,
      selectedProject,
      scene,
    ]
  );

  // Add multiple aircon items to scene from a card
  const addAirconCardToScene = useCallback(
    async (address, selectedProperties) => {
      // Find the single aircon item for this address
      const airconItem = projectItems.aircon?.find(
        (item) => item.address === address
      );

      if (!airconItem) return;

      // Check if any of the properties can be added
      if (formData.address && selectedProject) {
        for (const property of selectedProperties) {
          try {
            const canAdd = await window.electronAPI.scene.canAddItemToScene(
              selectedProject.id,
              formData.address,
              "aircon",
              airconItem.id,
              property.objectType,
              mode === "edit" && scene ? scene.id : null // Exclude current scene when editing
            );

            if (!canAdd) {
              toast.error(
                `Aircon ${
                  AIRCON_OBJECT_LABELS[property.objectType] ||
                  property.objectType
                } is already used by another scene with address ${
                  formData.address
                }`
              );
              return;
            }
          } catch (error) {
            console.error(
              "Failed to check if aircon item can be added:",
              error
            );
            // Continue with adding if check fails
          }
        }
      }

      selectedProperties.forEach((property) => {
        // Create scene item with the aircon item ID but specific object_type and value
        const newSceneItem = {
          id:
            mode === "edit"
              ? `temp_${Date.now()}_${property.objectType}`
              : `${Date.now()}_${property.objectType}`,
          item_type: "aircon",
          item_id: airconItem.id,
          item_value: property.value,
          command: getCommandForAirconItem(property.objectType, property.value),
          object_type: property.objectType,
          item_name: airconItem.name,
          item_address: airconItem.address,
          item_description: airconItem.description,
          label:
            AIRCON_OBJECT_LABELS[property.objectType] || property.objectType,
        };
        setSceneItems((prev) => [...prev, newSceneItem]);
      });
    },
    [
      projectItems.aircon,
      getCommandForAirconItem,
      mode,
      formData.address,
      selectedProject,
      scene,
    ]
  );

  // Handle opening aircon properties dialog
  const handleAddAirconCard = useCallback((airconCard) => {
    setAirconPropertiesDialog({
      open: true,
      airconCard,
    });
  }, []);

  // Handle confirming aircon properties selection
  const handleAirconPropertiesConfirm = useCallback(
    async (address, selectedProperties) => {
      await addAirconCardToScene(address, selectedProperties);
    },
    [addAirconCardToScene]
  );

  // Remove all aircon items from a specific address
  const removeAirconGroupFromScene = useCallback((address) => {
    setSceneItems((prev) =>
      prev.filter(
        (item) =>
          !(item.item_type === "aircon" && item.item_address === address)
      )
    );
  }, []);

  // Handle opening edit aircon properties dialog
  const handleEditAirconGroup = useCallback((airconGroup) => {
    setEditAirconPropertiesDialog({
      open: true,
      airconGroup,
    });
  }, []);

  // Handle confirming edit aircon properties
  const handleEditAirconPropertiesConfirm = useCallback(
    async (address, selectedProperties) => {
      // Find the single aircon item for this address
      const airconItem = projectItems.aircon?.find(
        (item) => item.address === address
      );

      if (!airconItem) return;

      // Check if any of the new properties can be added (with current scene excluded)
      if (formData.address && selectedProject) {
        for (const property of selectedProperties) {
          try {
            const canAdd = await window.electronAPI.scene.canAddItemToScene(
              selectedProject.id,
              formData.address,
              "aircon",
              airconItem.id,
              property.objectType,
              mode === "edit" && scene ? scene.id : null // Exclude current scene when editing
            );

            if (!canAdd) {
              toast.error(
                `Aircon ${
                  AIRCON_OBJECT_LABELS[property.objectType] ||
                  property.objectType
                } is already used by another scene with address ${
                  formData.address
                }`
              );
              return;
            }
          } catch (error) {
            console.error(
              "Failed to check if aircon item can be added:",
              error
            );
            // Continue with adding if check fails
          }
        }
      }

      // Update scene items directly to avoid UI flicker
      setSceneItems((prev) => {
        // Remove existing aircon items for this address
        const filteredItems = prev.filter(
          (item) =>
            !(item.item_type === "aircon" && item.item_address === address)
        );

        // Add new selected properties
        const newAirconItems = selectedProperties.map((property) => ({
          id:
            mode === "edit"
              ? `temp_${Date.now()}_${property.objectType}`
              : `${Date.now()}_${property.objectType}`,
          item_type: "aircon",
          item_id: airconItem.id,
          item_value: property.value,
          command: getCommandForAirconItem(property.objectType, property.value),
          object_type: property.objectType,
          item_name: airconItem.name,
          item_address: airconItem.address,
          item_description: airconItem.description,
          label:
            AIRCON_OBJECT_LABELS[property.objectType] || property.objectType,
        }));

        return [...filteredItems, ...newAirconItems];
      });
    },
    [
      projectItems.aircon,
      getCommandForAirconItem,
      mode,
      formData.address,
      selectedProject,
      scene,
    ]
  );

  // Get aircon cards from aircon items - memoized
  const availableAirconCards = useMemo(() => {
    if (!projectItems.aircon) return [];

    // Each aircon item is now a single card
    return projectItems.aircon
      .map((item) => ({
        address: item.address,
        name: item.name,
        description: item.description,
        item: item, // Store the single item
      }))
      .sort((a, b) => parseInt(a.address) - parseInt(b.address));
  }, [projectItems.aircon]);

  // Get grouped scene items for display - memoized
  const groupedSceneItems = useMemo(() => {
    const grouped = [];
    const airconGroups = new Map();

    sceneItems.forEach((item) => {
      if (item.item_type === "aircon") {
        if (!airconGroups.has(item.item_address)) {
          airconGroups.set(item.item_address, {
            type: "aircon-group",
            address: item.item_address,
            name: item.item_name,
            description: item.item_description,
            items: [],
          });
        }
        airconGroups.get(item.item_address).items.push(item);
      } else {
        grouped.push(item);
      }
    });

    // Add aircon groups to the result
    airconGroups.forEach((group) => {
      grouped.push(group);
    });

    return grouped.sort((a, b) => {
      // Sort by address if both have addresses
      if (a.address && b.address) {
        return parseInt(a.address) - parseInt(b.address);
      }
      if (a.item_address && b.item_address) {
        return parseInt(a.item_address) - parseInt(b.item_address);
      }
      return 0;
    });
  }, [sceneItems]);

  // Memoize filtered data for tabs to avoid recalculation on every render
  const filteredLightingItems = useMemo(() => {
    return (
      projectItems.lighting?.filter((item) => {
        // Filter out items already in current scene
        const isInCurrentScene = sceneItems.some(
          (si) => si.item_type === "lighting" && si.item_id === item.id
        );

        // Filter out items used by other scenes with same address
        const isUsedByOtherScene = usedItemsByAddress.some(
          (usedItem) =>
            usedItem.item_type === "lighting" && usedItem.item_id === item.id
        );

        return !isInCurrentScene && !isUsedByOtherScene;
      }) || []
    );
  }, [projectItems.lighting, sceneItems, usedItemsByAddress]);

  const filteredAirconCards = useMemo(() => {
    return availableAirconCards.filter((card) => {
      // Filter out cards already in current scene
      const isInCurrentScene = sceneItems.some(
        (si) => si.item_type === "aircon" && si.item_address === card.address
      );

      // Filter out cards where any aircon item is used by other scenes with same address
      const isUsedByOtherScene = usedItemsByAddress.some(
        (usedItem) =>
          usedItem.item_type === "aircon" && usedItem.item_id === card.item.id
      );

      return !isInCurrentScene && !isUsedByOtherScene;
    });
  }, [availableAirconCards, sceneItems, usedItemsByAddress]);

  const filteredCurtainItems = useMemo(() => {
    return (
      projectItems.curtain?.filter((item) => {
        // Filter out items already in current scene
        const isInCurrentScene = sceneItems.some(
          (si) => si.item_type === "curtain" && si.item_id === item.id
        );

        // Filter out items used by other scenes with same address
        const isUsedByOtherScene = usedItemsByAddress.some(
          (usedItem) =>
            usedItem.item_type === "curtain" && usedItem.item_id === item.id
        );

        return !isInCurrentScene && !isUsedByOtherScene;
      }) || []
    );
  }, [projectItems.curtain, sceneItems, usedItemsByAddress]);

  const filteredKnxItems = useMemo(() => {
    return (
      projectItems.knx?.filter((item) => {
        // Filter out items already in current scene
        const isInCurrentScene = sceneItems.some(
          (si) => si.item_type === "knx" && si.item_id === item.id
        );

        // Filter out items used by other scenes with same address
        const isUsedByOtherScene = usedItemsByAddress.some(
          (usedItem) =>
            usedItem.item_type === "knx" && usedItem.item_id === item.id
        );

        return !isInCurrentScene && !isUsedByOtherScene;
      }) || []
    );
  }, [projectItems.knx, sceneItems, usedItemsByAddress]);

  const removeItemFromScene = useCallback((sceneItemId) => {
    // Always remove from local state only - changes will be saved when user clicks Save
    setSceneItems((prev) => prev.filter((item) => item.id !== sceneItemId));
  }, []);

  const updateSceneItemValue = useCallback(
    (sceneItemId, itemValue) => {
      // Always update local state only - changes will be saved when user clicks Save
      setSceneItems((prev) =>
        prev.map((item) => {
          if (item.id === sceneItemId) {
            let command = null;
            if (item.item_type === "aircon") {
              command = getCommandForAirconItem(item.object_type, itemValue);
            }
            return { ...item, item_value: itemValue, command: command };
          }
          return item;
        })
      );
    },
    [getCommandForAirconItem]
  );

  const applySceneItemsChanges = async (sceneId) => {
    // Compare current sceneItems with originalSceneItems to determine changes

    // Find items to remove (in original but not in current)
    const itemsToRemove = originalSceneItems.filter(
      (item) => !sceneItems.some((currentItem) => currentItem.id === item.id)
    );

    // Find items to add (in current but not in original, or have temp IDs)
    const itemsToAdd = sceneItems.filter(
      (item) =>
        !originalSceneItems.some(
          (originalItem) => originalItem.id === item.id
        ) || item.id.toString().startsWith("temp_")
    );

    // Find items to update (same ID but different values)
    const itemsToUpdate = sceneItems.filter((item) => {
      const originalItem = originalSceneItems.find(
        (orig) => orig.id === item.id
      );
      return (
        originalItem &&
        (originalItem.item_value !== item.item_value ||
          originalItem.command !== item.command)
      );
    });

    // Remove items
    for (const item of itemsToRemove) {
      await window.electronAPI.scene.removeItem(item.id);
    }

    // Add new items
    for (const item of itemsToAdd) {
      await window.electronAPI.scene.addItem(
        sceneId,
        item.item_type,
        item.item_id,
        item.item_value,
        item.command,
        item.object_type
      );
    }

    // Update existing items
    for (const item of itemsToUpdate) {
      await window.electronAPI.scene.updateItemValue(
        item.id,
        item.item_value,
        item.command
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate name
    const nameError = validateName(formData.name);
    if (nameError) {
      setErrors({ name: nameError });
      return;
    }

    // Validate address before submitting
    const addressError = validateAddress(formData.address);
    if (addressError) {
      setErrors({ address: addressError });
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && scene) {
        // Update scene basic info
        await updateItem("scene", scene.id, formData);

        // Apply scene items changes
        await applySceneItemsChanges(scene.id);
      } else {
        // Create new scene
        const newScene = await createItem("scene", formData);

        // Add all scene items
        for (const sceneItem of sceneItems) {
          await window.electronAPI.scene.addItem(
            newScene.id,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type
          );
        }

        // Switch to scene tab to show the newly created scene
        setActiveTab("scene");
      }
      onOpenChange(false);

      // Reset form data after successful creation
      setFormData({
        name: "",
        address: "",
        description: "",
      });
      setSceneItems([]);
      setOriginalSceneItems([]);
      setErrors({});
    } catch (error) {
      console.error("Failed to save scene:", error);

      // Handle specific error messages
      if (
        error.message &&
        error.message.includes("already used by another scene")
      ) {
        setErrors({ general: error.message });
      } else if (error.message && error.message.includes("already exists")) {
        // Extract the clean error message after the last colon
        const cleanMessage = error.message.split(": ").pop();
        setErrors({ address: cleanMessage });
      } else if (
        error.message &&
        error.message.includes("15 characters or less")
      ) {
        setErrors({ name: "Scene name must be 15 characters or less" });
      } else if (
        error.message &&
        error.message.includes("Address is required")
      ) {
        setErrors({ address: "Address is required for scenes" });
      } else {
        // Handle other errors generically
        setErrors({ general: "Failed to save scene. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetToOriginalState = useCallback(() => {
    if (mode === "edit" && originalSceneItems.length > 0) {
      // Reset to original state
      setSceneItems([...originalSceneItems]);
      setFormData({
        name: scene?.name || "",
        address: scene?.address || "",
        description: scene?.description || "",
      });
    }
    setErrors({});
  }, [mode, originalSceneItems, scene]);

  const handleCancel = useCallback(() => {
    resetToOriginalState();
    onOpenChange(false);
  }, [resetToOriginalState, onOpenChange]);

  const handleDialogOpenChange = useCallback(
    (isOpen) => {
      if (!isOpen) {
        // When dialog is being closed, reset changes first
        resetToOriginalState();
      }
      onOpenChange(isOpen);
    },
    [resetToOriginalState, onOpenChange]
  );

  // Memoize value options to prevent recalculation on every render
  const getValueOptions = useMemo(() => {
    const optionsCache = {
      [OBJECT_TYPES.AC_POWER.obj_name]: Object.entries(AC_POWER_LABELS).map(
        ([value, label]) => ({
          value,
          label,
        })
      ),
      [OBJECT_TYPES.AC_FAN_SPEED.obj_name]: Object.entries(
        AC_FAN_SPEED_LABELS
      ).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_MODE.obj_name]: Object.entries(AC_MODE_LABELS).map(
        ([value, label]) => ({
          value,
          label,
        })
      ),
      [OBJECT_TYPES.AC_SWING.obj_name]: Object.entries(AC_SWING_LABELS).map(
        ([value, label]) => ({
          value,
          label,
        })
      ),
      [OBJECT_TYPES.AC_TEMPERATURE.obj_name]: [],
      [OBJECT_TYPES.CURTAIN.obj_name]: Object.entries(CURTAIN_VALUE_LABELS).map(
        ([value, label]) => ({
          value,
          label,
        })
      ),
      curtain: Object.entries(CURTAIN_VALUE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    };

    return (objectType, itemType) => {
      if (optionsCache[objectType]) {
        return optionsCache[objectType];
      }
      // For curtain items without specific object type, return curtain values
      if (itemType === "curtain") {
        return optionsCache.curtain;
      }
      return [];
    };
  }, []);

  const renderValueControl = useCallback(
    (sceneItem) => {
      const options = getValueOptions(
        sceneItem.object_type,
        sceneItem.item_type
      );

      // For lighting items, always use number input for brightness (0-100)
      if (sceneItem.item_type === "lighting") {
        const handleLightingChange = (e) => {
          const inputValue = e.target.value;
          if (inputValue === "") {
            updateSceneItemValue(sceneItem.id, "100");
          } else {
            const value = Math.min(100, Math.max(0, parseInt(inputValue) || 0));
            updateSceneItemValue(sceneItem.id, value.toString());
          }
        };

        return (
          <div className="relative">
            <Sun className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min="0"
              max="100"
              value={sceneItem.item_value || "100"}
              onChange={handleLightingChange}
              className="w-40 pl-8 font-semibold"
            />
          </div>
        );
      }

      // For curtain items, use select dropdown with Open/Close/Stop options
      if (sceneItem.item_type === "curtain") {
        const handleCurtainChange = (value) =>
          updateSceneItemValue(sceneItem.id, value);

        return (
          <Select
            value={sceneItem.item_value || "1"}
            onValueChange={handleCurtainChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      // For aircon temperature, use number input for decimal values
      if (sceneItem.object_type === OBJECT_TYPES.AC_TEMPERATURE.obj_name) {
        const handleTemperatureChange = (e) => {
          const inputValue = e.target.value;
          if (inputValue === "") {
            updateSceneItemValue(sceneItem.id, "25");
          } else {
            const value = Math.min(
              40,
              Math.max(0, parseFloat(inputValue) || 25)
            );
            updateSceneItemValue(sceneItem.id, value.toString());
          }
        };

        return (
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="40"
              step="0.5"
              value={sceneItem.item_value || "25"}
              onChange={handleTemperatureChange}
              className="w-40 font-semibold"
              placeholder="25.5"
            />
          </div>
        );
      }

      // For other aircon items, use select dropdown
      if (options.length > 0) {
        const handleSelectChange = (value) =>
          updateSceneItemValue(sceneItem.id, value);

        return (
          <Select
            value={sceneItem.item_value || ""}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      // Fallback for other items
      const handleFallbackChange = (e) =>
        updateSceneItemValue(sceneItem.id, e.target.value);

      return (
        <Input
          type="number"
          value={sceneItem.item_value || ""}
          onChange={handleFallbackChange}
          placeholder="Value"
          className="w-40"
        />
      );
    },
    [getValueOptions, updateSceneItemValue]
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Scene" : "Create New Scene"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the scene details and manage scene items."
              : "Create a new scene and add items from lighting, aircon, and curtain sections."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Scene Basic Info */}
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-right pl-1">
                  Name *
                </Label>
                <div className="col-span-5">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter scene name (max 15 characters)"
                    className={errors.name ? "border-red-500" : ""}
                    maxLength={15}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="address" className="text-right pl-1">
                  Address <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-5">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className={
                      errors.address
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }
                    placeholder="Enter integer 1-255 (e.g., 1, 2, 255)"
                    required
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description" className="text-right pl-1">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="col-span-5"
                  placeholder="Enter description"
                />
              </div>
            </div>

            {/* Scene Items Management */}
            <div className="space-y-4">
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Scene Items</h3>
                <p className="text-sm text-muted-foreground">
                  Add items from the right panel. You can set values for each
                  item if applicable.
                </p>
              </div>

              {/* Two-column layout for Current Items and Add Items */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Scene Items - Left Side */}
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-sm">Current Items</CardTitle>
                    <Badge variant="secondary">{sceneItems.length} items</Badge>
                  </CardHeader>
                  <CardContent>
                    {sceneItems.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {groupedSceneItems.map((item) => {
                          // Render aircon group
                          if (item.type === "aircon-group") {
                            return (
                              <div
                                key={`aircon-group-${item.address}`}
                                className="border rounded-lg p-2"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Wind className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <div className="font-medium text-sm">
                                        {item.name || `Aircon ${item.address}`}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Address: {item.address} |{" "}
                                        {item.items.length} properties
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        handleEditAirconGroup(item)
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        removeAirconGroupFromScene(item.address)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {/* Show individual aircon properties */}
                                <div className="space-y-1 ml-6">
                                  {item.items.map((airconItem) => (
                                    <div
                                      key={airconItem.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-muted-foreground">
                                        {AIRCON_OBJECT_LABELS[
                                          airconItem.object_type
                                        ] || airconItem.object_type}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {renderValueControl(airconItem)}
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeItemFromScene(airconItem.id)
                                          }
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          // Render regular items (lighting, curtain)
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 border rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                {item.item_type === "lighting" && (
                                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                                )}
                                {item.item_type === "curtain" && (
                                  <Blinds className="h-4 w-4 text-green-500" />
                                )}
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.item_name ||
                                      `${item.item_type} ${item.item_address}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Address: {item.item_address}
                                    {item.object_type &&
                                      ` | ${item.object_type}`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {(item.object_type ||
                                  item.item_type === "lighting") &&
                                  renderValueControl(item)}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeItemFromScene(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <p className="text-sm">No items in scene yet</p>
                        <p className="text-xs">
                          Add items from the right panel
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Add Items to Scene - Right Side */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Available Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="lighting" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="lighting">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Lighting
                        </TabsTrigger>
                        <TabsTrigger value="aircon">
                          <Wind className="h-4 w-4 mr-2" />
                          Aircon
                        </TabsTrigger>
                        <TabsTrigger value="curtain">
                          <Blinds className="h-4 w-4 mr-2" />
                          Curtain
                        </TabsTrigger>
                        <TabsTrigger value="knx">
                          <Network className="h-4 w-4 mr-2" />
                          KNX
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="lighting" className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                          {filteredLightingItems.length > 0 ? (
                            filteredLightingItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 border rounded-lg"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.name || `Group ${item.address}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Address: {item.address}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    addItemToScene("lighting", item.id, "100")
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No lighting items available
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="aircon" className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                          {filteredAirconCards.length > 0 ? (
                            filteredAirconCards.map((card) => (
                              <div
                                key={card.address}
                                className="flex items-center justify-between p-2 border rounded-lg"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {card.name || `Aircon ${card.address}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Address: {card.address}
                                  </div>
                                  {card.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {card.description}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleAddAirconCard(card)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No aircon cards available
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="curtain" className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                          {filteredCurtainItems.length > 0 ? (
                            filteredCurtainItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 border rounded-lg"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Address: {item.address}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    addItemToScene("curtain", item.id, "1")
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No curtain items available
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="knx" className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                          {filteredKnxItems.length > 0 ? (
                            filteredKnxItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 border rounded-lg"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.name || `KNX ${item.address}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Address: {item.address}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    addItemToScene("knx", item.id, "1")
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No KNX devices available
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* General Error Display */}
          {errors.general && (
            <div className="text-sm text-red-500 text-center mt-4">
              {errors.general}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.name.trim() ||
                !formData.address.trim() ||
                errors.name ||
                errors.address
              }
            >
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Aircon Properties Dialog */}
      <AirconPropertiesDialog
        open={airconPropertiesDialog.open}
        onOpenChange={(open) =>
          setAirconPropertiesDialog((prev) => ({ ...prev, open }))
        }
        airconCard={airconPropertiesDialog.airconCard}
        onConfirm={handleAirconPropertiesConfirm}
      />

      {/* Edit Aircon Properties Dialog */}
      <AirconPropertiesDialog
        open={editAirconPropertiesDialog.open}
        onOpenChange={(open) =>
          setEditAirconPropertiesDialog((prev) => ({ ...prev, open }))
        }
        airconGroup={editAirconPropertiesDialog.airconGroup}
        mode="edit"
        onConfirm={handleEditAirconPropertiesConfirm}
      />
    </Dialog>
  );
}
