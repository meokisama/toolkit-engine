import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { OBJECT_TYPES, CONSTANTS } from "@/constants";
import { AirconPropertiesDialog } from "./aircon-properties-dialog";
import { ProjectItemDialog } from "../lighting/lighting-dialog";
import { CurtainDialog } from "../curtain/curtain-dialog";
import { toast } from "sonner";
import { SceneBasicInfoForm } from "./scene-basic-info-form";
import { CurrentSceneItems } from "./current-scene-items";
import { AvailableItemsTabs } from "./available-items-tabs";

// Create label mappings directly from CONSTANTS.AIRCON
const AC_POWER_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_POWER")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

const AC_MODE_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_MODE")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

const AC_FAN_SPEED_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_FAN_SPEED")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

const AC_SWING_LABELS =
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_SWING")?.values.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {}) || {};

export function SceneDialog({ open, onOpenChange, scene = null, mode = "create" }) {
  const { selectedProject, projectItems, createItem, updateItem, setActiveTab, loadTabData, loadedTabs } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    source_unit: null,
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
  const [customBrightnessDialog, setCustomBrightnessDialog] = useState({
    open: false,
    brightness: 50,
    brightness255: 128,
  });
  const [lightingDialog, setLightingDialog] = useState({
    open: false,
  });
  const [airconDialog, setAirconDialog] = useState({
    open: false,
  });
  const [curtainDialog, setCurtainDialog] = useState({
    open: false,
  });
  const [editLightingDialog, setEditLightingDialog] = useState({
    open: false,
    item: null,
  });
  const [editAirconDialog, setEditAirconDialog] = useState({
    open: false,
    item: null,
  });
  const [editCurtainDialog, setEditCurtainDialog] = useState({
    open: false,
    item: null,
  });
  const [currentTab, setCurrentTab] = useState("lighting"); // Track current active tab

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

  useEffect(() => {
    if (open) {
      if (mode === "edit" && scene) {
        setFormData({
          name: scene.name || "",
          address: scene.address || "",
          description: scene.description || "",
          source_unit: scene.source_unit || null,
        });
        loadSceneItems(scene.id);
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
          source_unit: null,
        });
        setSceneItems([]);
        setOriginalSceneItems([]);
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
        // Load unit data if not already loaded
        if (!loadedTabs.has("unit")) {
          loadTabData(selectedProject.id, "unit");
        }
      }
    }
  }, [open, mode, scene, selectedProject, loadedTabs, loadTabData, loadSceneItems]);

  // Reload scene items when project data changes (to reflect address updates or item deletions)
  useEffect(() => {
    if (open && mode === "edit" && scene && scene.id) {
      // Reload scene items when project data changes to reflect any address updates or item deletions
      loadSceneItems(scene.id);
    }
  }, [open, mode, scene, projectItems.aircon, projectItems.lighting, projectItems.curtain, loadSceneItems]);

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
        }, 300); // 300ms debounce
      }
    },
    [validateAddress]
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
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_POWER").values.find((item) => item.value.toString() === itemValue)?.command ||
          null
        );
      case OBJECT_TYPES.AC_FAN_SPEED.obj_name:
        return (
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_FAN_SPEED").values.find((item) => item.value.toString() === itemValue)?.command ||
          null
        );
      case OBJECT_TYPES.AC_MODE.obj_name:
        return (
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_MODE").values.find((item) => item.value.toString() === itemValue)?.command || null
        );
      case OBJECT_TYPES.AC_SWING.obj_name:
        return (
          CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_SWING").values.find((item) => item.value.toString() === itemValue)?.command ||
          null
        );
      case OBJECT_TYPES.AC_TEMPERATURE.obj_name:
        return null; // Temperature doesn't use commands, just direct value
      default:
        return null;
    }
  }, []);

  const addItemToScene = useCallback(
    async (itemType, itemId, itemValue = null) => {
      // Check scene items limit (60 items maximum)
      if (sceneItems.length >= 60) {
        toast.error("Maximum 60 items allowed per scene");
        return;
      }

      const item = getItemDetails(itemType, itemId);
      if (!item) return;

      // Get command and object_type for the item
      let command = null;
      let objectType = item.object_type;

      // For aircon items, get the command based on object_type and value
      if (itemType === "aircon" && itemValue !== null) {
        command = getCommandForAirconItem(item.object_type, itemValue);
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
    [sceneItems.length, getItemDetails, getCommandForAirconItem, mode]
  );

  // Add multiple aircon items to scene from a card
  const addAirconCardToScene = useCallback(
    async (address, selectedProperties) => {
      // Check scene items limit (60 items maximum)
      if (sceneItems.length + selectedProperties.length > 60) {
        toast.error(`Cannot add ${selectedProperties.length} items. Maximum 60 items allowed per scene (current: ${sceneItems.length})`);
        return;
      }

      // Find the single aircon item for this address
      const airconItem = projectItems.aircon?.find((item) => item.address === address);

      if (!airconItem) return;

      selectedProperties.forEach((property) => {
        // Create scene item with the aircon item ID but specific object_type and value
        const newSceneItem = {
          id: mode === "edit" ? `temp_${Date.now()}_${property.objectType}` : `${Date.now()}_${property.objectType}`,
          item_type: "aircon",
          item_id: airconItem.id,
          item_value: property.value,
          command: getCommandForAirconItem(property.objectType, property.value),
          object_type: property.objectType,
          item_name: airconItem.name,
          item_address: airconItem.address,
          item_description: airconItem.description,
          label: CONSTANTS.AIRCON.find((item) => item.obj_type === property.objectType)?.label || property.objectType,
        };
        setSceneItems((prev) => [...prev, newSceneItem]);
      });
    },
    [sceneItems.length, projectItems.aircon, getCommandForAirconItem, mode]
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

  // Handle opening add new item dialogs
  const handleOpenLightingDialog = useCallback(() => {
    setLightingDialog({ open: true });
  }, []);

  const handleOpenAirconDialog = useCallback(() => {
    setAirconDialog({ open: true });
  }, []);

  const handleOpenCurtainDialog = useCallback(() => {
    setCurtainDialog({ open: true });
  }, []);

  // Handle closing add new item dialogs
  const handleCloseLightingDialog = useCallback(
    (open) => {
      setLightingDialog({ open });
      // Reload lighting data when dialog closes after successful creation
      if (!open && selectedProject) {
        loadTabData("lighting");
      }
    },
    [selectedProject, loadTabData]
  );

  const handleCloseAirconDialog = useCallback(
    (open) => {
      setAirconDialog({ open });
      // Reload aircon data when dialog closes after successful creation
      if (!open && selectedProject) {
        loadTabData("aircon");
      }
    },
    [selectedProject, loadTabData]
  );

  const handleCloseCurtainDialog = useCallback(
    (open) => {
      setCurtainDialog({ open });
      // Reload curtain data when dialog closes after successful creation
      if (!open && selectedProject) {
        loadTabData("curtain");
      }
    },
    [selectedProject, loadTabData]
  );

  // Handle opening dialog based on current tab
  const handleAddNewItem = useCallback(() => {
    switch (currentTab) {
      case "lighting":
        handleOpenLightingDialog();
        break;
      case "aircon":
        handleOpenAirconDialog();
        break;
      case "curtain":
        handleOpenCurtainDialog();
        break;
      default:
        break;
    }
  }, [currentTab, handleOpenLightingDialog, handleOpenAirconDialog, handleOpenCurtainDialog]);

  // Handle opening edit dialogs
  const handleEditLightingItem = useCallback((item) => {
    setEditLightingDialog({ open: true, item });
  }, []);

  const handleEditAirconItem = useCallback((item) => {
    setEditAirconDialog({ open: true, item });
  }, []);

  const handleEditCurtainItem = useCallback((item) => {
    setEditCurtainDialog({ open: true, item });
  }, []);

  // Handle closing edit dialogs
  const handleCloseEditLightingDialog = useCallback(
    (open) => {
      setEditLightingDialog({ open, item: null });
      // Reload lighting data when dialog closes after successful edit
      if (!open && selectedProject) {
        loadTabData("lighting");
      }
    },
    [selectedProject, loadTabData]
  );

  const handleCloseEditAirconDialog = useCallback(
    (open) => {
      setEditAirconDialog({ open, item: null });
      // Reload aircon data when dialog closes after successful edit
      if (!open && selectedProject) {
        loadTabData("aircon");
      }
    },
    [selectedProject, loadTabData]
  );

  const handleCloseEditCurtainDialog = useCallback(
    (open) => {
      setEditCurtainDialog({ open, item: null });
      // Reload curtain data when dialog closes after successful edit
      if (!open && selectedProject) {
        loadTabData("curtain");
      }
    },
    [selectedProject, loadTabData]
  );

  // Remove all aircon items from a specific address
  const removeAirconGroupFromScene = useCallback((address) => {
    setSceneItems((prev) => prev.filter((item) => !(item.item_type === "aircon" && item.item_address === address)));
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
      const airconItem = projectItems.aircon?.find((item) => item.address === address);

      if (!airconItem) return;

      // Update scene items directly to avoid UI flicker
      setSceneItems((prev) => {
        // Remove existing aircon items for this address
        const filteredItems = prev.filter((item) => !(item.item_type === "aircon" && item.item_address === address));

        // Add new selected properties
        const newAirconItems = selectedProperties.map((property) => ({
          id: mode === "edit" ? `temp_${Date.now()}_${property.objectType}` : `${Date.now()}_${property.objectType}`,
          item_type: "aircon",
          item_id: airconItem.id,
          item_value: property.value,
          command: getCommandForAirconItem(property.objectType, property.value),
          object_type: property.objectType,
          item_name: airconItem.name,
          item_address: airconItem.address,
          item_description: airconItem.description,
          label: CONSTANTS.AIRCON.find((item) => item.obj_type === property.objectType)?.label || property.objectType,
        }));

        return [...filteredItems, ...newAirconItems];
      });
    },
    [projectItems.aircon, getCommandForAirconItem, mode]
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
        const isInCurrentScene = sceneItems.some((si) => si.item_type === "lighting" && si.item_id === item.id);
        return !isInCurrentScene;
      }) || []
    );
  }, [projectItems.lighting, sceneItems]);

  const filteredAirconCards = useMemo(() => {
    return availableAirconCards.filter((card) => {
      // Filter out cards already in current scene
      const isInCurrentScene = sceneItems.some((si) => si.item_type === "aircon" && si.item_address === card.address);
      return !isInCurrentScene;
    });
  }, [availableAirconCards, sceneItems]);

  const filteredCurtainItems = useMemo(() => {
    return (
      projectItems.curtain?.filter((item) => {
        // Filter out items already in current scene
        const isInCurrentScene = sceneItems.some((si) => si.item_type === "curtain" && si.item_id === item.id);
        return !isInCurrentScene;
      }) || []
    );
  }, [projectItems.curtain, sceneItems]);

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

  // All On: Set all lighting items to 100% brightness (255 in 0-255 scale)
  const handleAllLightingOn = useCallback(() => {
    setSceneItems((prev) =>
      prev.map((item) => {
        if (item.item_type === "lighting") {
          return { ...item, item_value: "255" };
        }
        return item;
      })
    );
  }, []);

  // All Off: Set all lighting items to 0% brightness
  const handleAllLightingOff = useCallback(() => {
    setSceneItems((prev) =>
      prev.map((item) => {
        if (item.item_type === "lighting") {
          return { ...item, item_value: "0" };
        }
        return item;
      })
    );
  }, []);

  // Custom: Set all lighting items to custom brightness
  const handleCustomBrightness = useCallback(() => {
    const { brightness255 } = customBrightnessDialog;

    // Use the 0-255 value for storage
    const value255 = parseInt(brightness255);
    if (isNaN(value255) || value255 < 0 || value255 > 255) {
      toast.error("Brightness must be between 0 and 255");
      return;
    }

    const percentValue = Math.round((value255 * 100) / 255);

    setSceneItems((prev) =>
      prev.map((item) => {
        if (item.item_type === "lighting") {
          return { ...item, item_value: value255.toString() };
        }
        return item;
      })
    );
    setCustomBrightnessDialog({
      open: false,
      brightness: 50,
      brightness255: 128,
    });
    toast.success(`Set all lighting to ${percentValue}% (${value255}/255) brightness`);
  }, [customBrightnessDialog]);

  const applySceneItemsChanges = async (sceneId) => {
    // Compare current sceneItems with originalSceneItems to determine changes

    // Find items to remove (in original but not in current)
    const itemsToRemove = originalSceneItems.filter((item) => !sceneItems.some((currentItem) => currentItem.id === item.id));

    // Find items to add (in current but not in original, or have temp IDs)
    const itemsToAdd = sceneItems.filter(
      (item) => !originalSceneItems.some((originalItem) => originalItem.id === item.id) || item.id.toString().startsWith("temp_")
    );

    // Find items to update (same ID but different values)
    const itemsToUpdate = sceneItems.filter((item) => {
      const originalItem = originalSceneItems.find((orig) => orig.id === item.id);
      return originalItem && (originalItem.item_value !== item.item_value || originalItem.command !== item.command);
    });

    // Remove items
    for (const item of itemsToRemove) {
      await window.electronAPI.scene.removeItem(item.id);
    }

    // Add new items
    for (const item of itemsToAdd) {
      await window.electronAPI.scene.addItem(sceneId, item.item_type, item.item_id, item.item_value, item.command, item.object_type);
    }

    // Update existing items
    for (const item of itemsToUpdate) {
      await window.electronAPI.scene.updateItemValue(item.id, item.item_value, item.command);
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
        source_unit: null,
      });
      setSceneItems([]);
      setOriginalSceneItems([]);
      setErrors({});
    } catch (error) {
      console.error("Failed to save scene:", error);

      // Handle specific error messages
      if (error.message && error.message.includes("already used by another scene")) {
        setErrors({ general: error.message });
      } else if (error.message && error.message.includes("already exists")) {
        // Extract the clean error message after the last colon
        const cleanMessage = error.message.split(": ").pop();
        setErrors({ address: cleanMessage });
      } else if (error.message && error.message.includes("Address is required")) {
        setErrors({ address: "Address is required for scenes" });
      } else if (error.message && error.message.includes("Maximum 100 scenes allowed")) {
        setErrors({
          general: "Maximum 100 scenes allowed per project (indexed 0-99)",
        });
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
        source_unit: scene?.source_unit || null,
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
      [OBJECT_TYPES.AC_POWER.obj_name]: Object.entries(AC_POWER_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_FAN_SPEED.obj_name]: Object.entries(AC_FAN_SPEED_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_MODE.obj_name]: Object.entries(AC_MODE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_SWING.obj_name]: Object.entries(AC_SWING_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      [OBJECT_TYPES.AC_TEMPERATURE.obj_name]: [],
      [OBJECT_TYPES.CURTAIN.obj_name]: CONSTANTS.CURTAIN.VALUES.map((item) => ({
        value: item.value.toString(),
        label: item.label,
      })),
      curtain: CONSTANTS.CURTAIN.VALUES.map((item) => ({
        value: item.value.toString(),
        label: item.label,
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


  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Scene" : "Create New Scene"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the scene details and manage scene items."
              : "Create a new scene and add items from lighting, aircon, and curtain sections."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Scene Basic Info */}
            <SceneBasicInfoForm formData={formData} errors={errors} onInputChange={handleInputChange} projectItems={projectItems} />

            {/* Scene Items Management */}
            <div className="space-y-4">
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Scene Items</h3>
                <p className="text-sm text-muted-foreground">Add items from the right panel. You can set values for each item if applicable.</p>
              </div>

              {/* Two-column layout for Current Items and Add Items */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Scene Items - Left Side */}
                <CurrentSceneItems
                  sceneItems={sceneItems}
                  groupedSceneItems={groupedSceneItems}
                  onAllLightingOn={handleAllLightingOn}
                  onAllLightingOff={handleAllLightingOff}
                  customBrightnessDialog={customBrightnessDialog}
                  setCustomBrightnessDialog={setCustomBrightnessDialog}
                  onCustomBrightness={handleCustomBrightness}
                  onEditAirconGroup={handleEditAirconGroup}
                  onRemoveAirconGroup={removeAirconGroupFromScene}
                  onRemoveItem={removeItemFromScene}
                  updateSceneItemValue={updateSceneItemValue}
                  getValueOptions={getValueOptions}
                />

                {/* Add Items to Scene - Right Side */}
                <AvailableItemsTabs
                  currentTab={currentTab}
                  onTabChange={setCurrentTab}
                  filteredLightingItems={filteredLightingItems}
                  filteredAirconCards={filteredAirconCards}
                  filteredCurtainItems={filteredCurtainItems}
                  onAddNewItem={handleAddNewItem}
                  onEditLightingItem={handleEditLightingItem}
                  onEditAirconItem={handleEditAirconItem}
                  onEditCurtainItem={handleEditCurtainItem}
                  onAddLightingItem={(itemId) => addItemToScene("lighting", itemId, "255")}
                  onAddAirconCard={handleAddAirconCard}
                  onAddCurtainItem={(itemId) => addItemToScene("curtain", itemId, "1")}
                />
              </div>
            </div>
          </div>

          {/* General Error Display */}
          {errors.general && <div className="text-sm text-red-500 text-center mt-4">{errors.general}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim() || !formData.address.trim() || errors.name || errors.address}>
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Aircon Properties Dialog */}
      <AirconPropertiesDialog
        open={airconPropertiesDialog.open}
        onOpenChange={(open) => setAirconPropertiesDialog((prev) => ({ ...prev, open }))}
        airconCard={airconPropertiesDialog.airconCard}
        onConfirm={handleAirconPropertiesConfirm}
      />

      {/* Edit Aircon Properties Dialog */}
      <AirconPropertiesDialog
        open={editAirconPropertiesDialog.open}
        onOpenChange={(open) => setEditAirconPropertiesDialog((prev) => ({ ...prev, open }))}
        airconGroup={editAirconPropertiesDialog.airconGroup}
        mode="edit"
        onConfirm={handleEditAirconPropertiesConfirm}
      />

      {/* Add New Lighting Dialog */}
      <ProjectItemDialog open={lightingDialog.open} onOpenChange={handleCloseLightingDialog} category="lighting" mode="create" />

      {/* Add New Aircon Dialog */}
      <ProjectItemDialog open={airconDialog.open} onOpenChange={handleCloseAirconDialog} category="aircon" mode="create" />

      {/* Add New Curtain Dialog */}
      <CurtainDialog open={curtainDialog.open} onOpenChange={handleCloseCurtainDialog} mode="create" />

      {/* Edit Lighting Dialog */}
      <ProjectItemDialog
        open={editLightingDialog.open}
        onOpenChange={handleCloseEditLightingDialog}
        category="lighting"
        item={editLightingDialog.item}
        mode="edit"
      />

      {/* Edit Aircon Dialog */}
      <ProjectItemDialog
        open={editAirconDialog.open}
        onOpenChange={handleCloseEditAirconDialog}
        category="aircon"
        item={editAirconDialog.item}
        mode="edit"
      />

      {/* Edit Curtain Dialog */}
      <CurtainDialog open={editCurtainDialog.open} onOpenChange={handleCloseEditCurtainDialog} item={editCurtainDialog.item} mode="edit" />
    </Dialog>
  );
}
