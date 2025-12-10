import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/custom/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Settings, RefreshCw, Plus } from "lucide-react";
import { CONSTANTS } from "@/constants";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { isSlaveType, isNoneType } from "@/utils/rs485-utils";
import { toast } from "sonner";

const { RS485 } = CONSTANTS;

export function NetworkRS485ConfigDialog({ open, onOpenChange, unit }) {
  const { airconCards, selectedProject, loadedTabs, loadTabData } =
    useProjectDetail();
  const [rs485Configs, setRS485Configs] = useState([]);
  const [activeRS485Tab, setActiveRS485Tab] = useState("0");
  const [openSlaves, setOpenSlaves] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create aircon options for combobox
  const airconOptions = (airconCards || []).map((card) => ({
    value: card.address.toString(),
    label:
      card.name && card.name.trim()
        ? `${card.name} (${card.address})`
        : `Aircon ${card.address}`,
  }));

  // Helper function to get mapped combobox value based on address
  const getMappedComboboxValue = (address) => {
    if (!address || address === 0) {
      return "";
    }

    // Find matching aircon option by address
    const matchingOption = airconOptions.find((option) => {
      return parseInt(option.value) === address;
    });

    return matchingOption ? matchingOption.value : address.toString();
  };

  // Helper function to convert combobox value back to address
  const getAddressFromComboboxValue = (value) => {
    if (!value || value === "") {
      return 0;
    }

    // Find the aircon card by the selected value (which is address)
    const selectedCard = airconCards.find(
      (card) => card.address.toString() === value
    );
    return selectedCard ? parseInt(selectedCard.address) : parseInt(value);
  };

  // Helper function to check if address exists in database
  const hasUnmappedAddress = (address) => {
    if (!address || address === 0) {
      return false;
    }

    // Check if address exists in airconOptions
    const addressExists = airconOptions.some((option) => {
      return parseInt(option.value) === address;
    });

    return !addressExists;
  };

  // Handle adding missing address to database
  const handleAddMissingAddress = useCallback(
    async (address) => {
      try {
        // Create new aircon item with the missing address
        const newAirconItem = {
          name: `Group ${address}`,
          address: address.toString(),
          description: `Auto-added from network unit RS485 config`,
        };

        // Add to database via electronAPI with projectId
        const result = await window.electronAPI.aircon.create(
          selectedProject.id,
          newAirconItem
        );

        if (result) {
          // Refresh aircon items to update the options
          await loadTabData(selectedProject.id, "aircon");

          // Show success message
          toast.success(`Aircon address ${address} added to database`);
        } else {
          throw new Error("Failed to create aircon item");
        }
      } catch (error) {
        console.error(`Error adding missing aircon address:`, error);
        toast.error(`Error adding aircon address: ${error.message}`);
      }
    },
    [selectedProject?.id, loadTabData]
  );

  // Load RS485 configurations from network unit
  const loadRS485Configs = async () => {
    if (!unit) return;

    setLoading(true);
    try {
      console.log("Loading RS485 configurations from unit:", unit.ip_address);

      // Load CH1 and CH2 configurations sequentially to avoid conflicts
      console.log("Loading RS485 CH1 configuration...");
      const ch1Config =
        await window.electronAPI.deviceController.getRS485CH1Config({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

      console.log("Loading RS485 CH2 configuration...");
      const ch2Config =
        await window.electronAPI.deviceController.getRS485CH2Config({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

      // Convert network unit format to dialog format
      const configs = [
        convertNetworkToDialogFormat(ch1Config),
        convertNetworkToDialogFormat(ch2Config),
      ];

      setRS485Configs(configs);
      toast.success("RS485 configurations loaded successfully");
    } catch (error) {
      console.error("Failed to load RS485 configurations:", error);
      toast.error(`Failed to load RS485 configurations: ${error.message}`);

      // Set default configurations on error
      const defaultConfigs = Array.from({ length: 2 }, () =>
        createDefaultNetworkRS485Config()
      );
      setRS485Configs(defaultConfigs);
    } finally {
      setLoading(false);
    }
  };

  // Load required data when dialog opens
  useEffect(() => {
    if (open && selectedProject) {
      // Load aircon data if not already loaded
      if (!loadedTabs.has("aircon")) {
        loadTabData(selectedProject.id, "aircon");
      }
    }
  }, [open, selectedProject, loadedTabs, loadTabData]);

  // Initialize configurations when dialog opens
  useEffect(() => {
    if (open && unit) {
      loadRS485Configs();
      setActiveRS485Tab("0");
      setOpenSlaves({});
    }
  }, [open, unit]);

  // Convert network unit format to dialog format
  const convertNetworkToDialogFormat = (networkConfig) => {
    return {
      baudrate: networkConfig.baudrate,
      parity: networkConfig.parity,
      stop_bit: networkConfig.stopBit,
      board_id: networkConfig.boardId,
      config_type: networkConfig.rs485Type,
      num_slave_devs: networkConfig.numSlaves,
      reserved: networkConfig.reserved || [0, 0, 0, 0, 0],
      slave_cfg: networkConfig.slaves.map((slave) => ({
        slave_id: slave.slaveId,
        slave_group: slave.slaveGroup,
        num_indoors: slave.numIndoors,
        indoor_group: slave.indoorGroups || new Array(16).fill(0),
      })),
    };
  };

  // Convert dialog format to network unit format
  const convertDialogToNetworkFormat = (dialogConfig) => {
    return {
      baudrate: dialogConfig.baudrate,
      parity: dialogConfig.parity,
      stopBit: dialogConfig.stop_bit,
      boardId: dialogConfig.board_id,
      rs485Type: dialogConfig.config_type,
      numSlaves: dialogConfig.num_slave_devs,
      reserved: dialogConfig.reserved || [0, 0, 0, 0, 0],
      slaves: dialogConfig.slave_cfg.map((slave) => ({
        slaveId: slave.slave_id,
        slaveGroup: slave.slave_group,
        numIndoors: slave.num_indoors,
        indoorGroups: slave.indoor_group || new Array(16).fill(0),
      })),
    };
  };

  // Create default network RS485 configuration
  const createDefaultNetworkRS485Config = () => {
    return {
      baudrate: 9600,
      parity: 0,
      stop_bit: 0,
      board_id: 1,
      config_type: 0,
      num_slave_devs: 0,
      reserved: [0, 0, 0, 0, 0],
      slave_cfg: Array.from({ length: RS485.SLAVE_MAX_DEVS }, () => ({
        slave_id: 1,
        slave_group: 0,
        num_indoors: 0,
        indoor_group: Array.from({ length: RS485.SLAVE_MAX_INDOORS }, () => 0),
      })),
    };
  };

  // Toggle slave collapsible state
  const toggleSlave = (slaveIndex) => {
    setOpenSlaves((prev) => ({
      ...prev,
      [slaveIndex]: !(prev[slaveIndex] || false),
    }));
  };

  const handleRS485ConfigChange = (configIndex, field, value) => {
    setRS485Configs((prev) => {
      const newConfigs = [...prev];
      newConfigs[configIndex] = {
        ...newConfigs[configIndex],
        [field]: value,
      };
      return newConfigs;
    });
  };

  const handleSlaveConfigChange = (configIndex, slaveIndex, field, value) => {
    setRS485Configs((prev) => {
      const newConfigs = [...prev];
      newConfigs[configIndex].slave_cfg[slaveIndex] = {
        ...newConfigs[configIndex].slave_cfg[slaveIndex],
        [field]: value,
      };
      return newConfigs;
    });
  };

  const handleIndoorGroupChange = (
    configIndex,
    slaveIndex,
    indoorIndex,
    value
  ) => {
    setRS485Configs((prev) => {
      const newConfigs = [...prev];
      newConfigs[configIndex].slave_cfg[slaveIndex].indoor_group[indoorIndex] =
        parseInt(value) || 0;
      return newConfigs;
    });
  };

  // Save configurations to network unit
  const handleSave = async () => {
    if (!unit) return;

    setSaving(true);
    try {
      console.log("Saving RS485 configurations to unit:", unit.ip_address);

      // Convert dialog format to network format and save both channels sequentially
      const ch1Config = convertDialogToNetworkFormat(rs485Configs[0]);
      const ch2Config = convertDialogToNetworkFormat(rs485Configs[1]);

      console.log("Saving RS485 CH1 configuration...");
      await window.electronAPI.deviceController.setRS485CH1Config({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        config: ch1Config,
      });

      // Add delay between RS485 channel writes to avoid conflicts
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Saving RS485 CH2 configuration...");
      await window.electronAPI.deviceController.setRS485CH2Config({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        config: ch2Config,
      });

      toast.success("RS485 configurations saved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save RS485 configurations:", error);
      toast.error(`Failed to save RS485 configurations: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const currentConfig =
    rs485Configs[parseInt(activeRS485Tab)] || createDefaultNetworkRS485Config();

  // Check if RS485 type is slave or none
  const isSlaveTypeConfig = isSlaveType(currentConfig.config_type);
  const isNoneTypeConfig = isNoneType(currentConfig.config_type);

  if (!unit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            RS485 Configuration - {unit.ip_address}
          </DialogTitle>
          <DialogDescription>
            Configure RS485 communication settings for network unit{" "}
            {unit.ip_address} (CAN ID: {unit.id_can}).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={loadRS485Configs}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Reload from Unit"}
          </Button>
        </div>

        <Tabs value={activeRS485Tab} onValueChange={setActiveRS485Tab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="0">RS485-1</TabsTrigger>
            <TabsTrigger value="1">RS485-2</TabsTrigger>
          </TabsList>

          {rs485Configs.map((config, configIndex) => (
            <TabsContent key={configIndex} value={configIndex.toString()}>
              <div className="space-y-6">
                {/* Interface Config */}
                <Card>
                  <CardHeader>
                    <CardTitle>Interface Config</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Baudrate</Label>
                      <Select
                        value={config.baudrate.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "baudrate",
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Select baudrate" />
                        </SelectTrigger>
                        <SelectContent>
                          {RS485.BAUDRATES.map((rate) => (
                            <SelectItem
                              key={rate.value}
                              value={rate.value.toString()}
                            >
                              {rate.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Parity</Label>
                      <Select
                        value={config.parity.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "parity",
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Select parity" />
                        </SelectTrigger>
                        <SelectContent>
                          {RS485.PARITY.map((parity) => (
                            <SelectItem
                              key={parity.value}
                              value={parity.value.toString()}
                            >
                              {parity.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Stop Bit</Label>
                      <Select
                        value={config.stop_bit.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "stop_bit",
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Select stop bit" />
                        </SelectTrigger>
                        <SelectContent>
                          {RS485.STOP_BITS.map((bit) => (
                            <SelectItem
                              key={bit.value}
                              value={bit.value.toString()}
                            >
                              {bit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Host Config */}
                <Card>
                  <CardHeader>
                    <CardTitle>Host Config</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Combobox
                        value={config.config_type.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "config_type",
                            parseInt(value)
                          )
                        }
                        options={RS485.TYPES.map((type) => ({
                          value: type.value.toString(),
                          label: type.label,
                        }))}
                        placeholder="Select RS485 type"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Board ID</Label>
                      <Input
                        type="number"
                        min="1"
                        max="255"
                        value={config.board_id}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          const clampedValue = Math.max(
                            1,
                            Math.min(255, value)
                          );
                          handleRS485ConfigChange(
                            configIndex,
                            "board_id",
                            clampedValue
                          );
                        }}
                        disabled={isNoneTypeConfig}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Number of Slaves (0-10)</Label>
                      <Input
                        type="number"
                        min="0"
                        max={RS485.SLAVE_MAX_DEVS}
                        value={config.num_slave_devs}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const clampedValue = Math.max(
                            0,
                            Math.min(RS485.SLAVE_MAX_DEVS, value)
                          );
                          handleRS485ConfigChange(
                            configIndex,
                            "num_slave_devs",
                            clampedValue
                          );
                        }}
                        disabled={isNoneTypeConfig || isSlaveTypeConfig}
                        placeholder="Enter number of slaves"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Slave Config */}
                {!isNoneTypeConfig && config.num_slave_devs > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Slave Config</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Array.from(
                        { length: config.num_slave_devs },
                        (_, slaveIndex) => (
                          <Collapsible
                            key={slaveIndex}
                            open={openSlaves[slaveIndex] || false}
                            onOpenChange={() => toggleSlave(slaveIndex)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex w-full justify-between p-4 h-auto"
                              >
                                <span className="font-medium">
                                  Slave #{slaveIndex + 1}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    openSlaves[slaveIndex] || false
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-4 bg-muted/50 rounded-b-lg shadow-sm">
                              <div className="space-y-4">
                                {/* Basic Slave Config */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Slave ID</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="255"
                                      value={
                                        config.slave_cfg[slaveIndex]
                                          ?.slave_id || 1
                                      }
                                      onChange={(e) => {
                                        const value =
                                          parseInt(e.target.value) || 1;
                                        const clampedValue = Math.max(
                                          1,
                                          Math.min(255, value)
                                        );
                                        handleSlaveConfigChange(
                                          configIndex,
                                          slaveIndex,
                                          "slave_id",
                                          clampedValue
                                        );
                                      }}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Slave Group</Label>
                                    <div className="flex items-center gap-2">
                                      {/* Plus button for adding missing address to database */}
                                      {hasUnmappedAddress(
                                        config.slave_cfg[slaveIndex]
                                          ?.slave_group || 0
                                      ) && (
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() =>
                                            handleAddMissingAddress(
                                              config.slave_cfg[slaveIndex]
                                                ?.slave_group || 0
                                            )
                                          }
                                          title={`Add aircon address ${
                                            config.slave_cfg[slaveIndex]
                                              ?.slave_group || 0
                                          } to database`}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      )}

                                      {/* Show combobox only if address is mapped */}
                                      {!hasUnmappedAddress(
                                        config.slave_cfg[slaveIndex]
                                          ?.slave_group || 0
                                      ) ? (
                                        <Combobox
                                          className="flex-1"
                                          value={getMappedComboboxValue(
                                            config.slave_cfg[slaveIndex]
                                              ?.slave_group || 0
                                          )}
                                          onValueChange={(value) =>
                                            handleSlaveConfigChange(
                                              configIndex,
                                              slaveIndex,
                                              "slave_group",
                                              getAddressFromComboboxValue(value)
                                            )
                                          }
                                          options={airconOptions}
                                          placeholder="Select aircon..."
                                          emptyText="No aircon found"
                                        />
                                      ) : (
                                        /* Show address info when not in database */
                                        <div className="flex-1 px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm">
                                          Address{" "}
                                          {config.slave_cfg[slaveIndex]
                                            ?.slave_group || 0}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Number of Indoors (0-16)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={RS485.SLAVE_MAX_INDOORS}
                                      value={
                                        config.slave_cfg[slaveIndex]
                                          ?.num_indoors || 0
                                      }
                                      onChange={(e) => {
                                        const value =
                                          parseInt(e.target.value) || 0;
                                        const clampedValue = Math.max(
                                          0,
                                          Math.min(
                                            RS485.SLAVE_MAX_INDOORS,
                                            value
                                          )
                                        );
                                        handleSlaveConfigChange(
                                          configIndex,
                                          slaveIndex,
                                          "num_indoors",
                                          clampedValue
                                        );
                                      }}
                                      placeholder="Enter number of indoors"
                                    />
                                  </div>
                                </div>

                                {/* Indoor Groups */}
                                {(config.slave_cfg[slaveIndex]?.num_indoors ||
                                  0) > 0 && (
                                  <div className="space-y-2">
                                    <Label>Indoor Groups</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {Array.from(
                                        {
                                          length:
                                            config.slave_cfg[slaveIndex]
                                              ?.num_indoors || 0,
                                        },
                                        (_, indoorIndex) => (
                                          <div
                                            key={indoorIndex}
                                            className="space-y-1"
                                          >
                                            <Label className="text-xs">
                                              Indoor {indoorIndex + 1}
                                            </Label>
                                            <div className="flex items-center gap-1">
                                              {/* Plus button for adding missing address to database */}
                                              {hasUnmappedAddress(
                                                config.slave_cfg[slaveIndex]
                                                  ?.indoor_group?.[
                                                  indoorIndex
                                                ] || 0
                                              ) && (
                                                <Button
                                                  variant="outline"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() =>
                                                    handleAddMissingAddress(
                                                      config.slave_cfg[
                                                        slaveIndex
                                                      ]?.indoor_group?.[
                                                        indoorIndex
                                                      ] || 0
                                                    )
                                                  }
                                                  title={`Add aircon address ${
                                                    config.slave_cfg[slaveIndex]
                                                      ?.indoor_group?.[
                                                      indoorIndex
                                                    ] || 0
                                                  } to database`}
                                                >
                                                  <Plus className="h-3 w-3" />
                                                </Button>
                                              )}

                                              {/* Show combobox only if address is mapped */}
                                              {!hasUnmappedAddress(
                                                config.slave_cfg[slaveIndex]
                                                  ?.indoor_group?.[
                                                  indoorIndex
                                                ] || 0
                                              ) ? (
                                                <Combobox
                                                  className="flex-1"
                                                  value={getMappedComboboxValue(
                                                    config.slave_cfg[slaveIndex]
                                                      ?.indoor_group?.[
                                                      indoorIndex
                                                    ] || 0
                                                  )}
                                                  onValueChange={(value) =>
                                                    handleIndoorGroupChange(
                                                      configIndex,
                                                      slaveIndex,
                                                      indoorIndex,
                                                      getAddressFromComboboxValue(
                                                        value
                                                      )
                                                    )
                                                  }
                                                  options={airconOptions}
                                                  placeholder="Select..."
                                                  emptyText="No aircon found"
                                                />
                                              ) : (
                                                /* Show address info when not in database */
                                                <div className="flex-1 px-2 py-1 border rounded-md bg-muted text-muted-foreground text-xs">
                                                  Address{" "}
                                                  {config.slave_cfg[slaveIndex]
                                                    ?.indoor_group?.[
                                                    indoorIndex
                                                  ] || 0}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
