import React, { useState, useEffect } from "react";
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
import { ChevronDown } from "lucide-react";
import { CONSTANTS } from "@/constants";
import { useProjectDetail } from "@/contexts/project-detail-context";
import {
  createDefaultRS485Config,
  isSlaveType,
  isNoneType,
} from "@/utils/rs485-utils";

const { RS485 } = CONSTANTS;

export function RS485ConfigDialog({ open, onOpenChange, config, onSave }) {
  const { airconCards, selectedProject, loadedTabs, loadTabData } = useProjectDetail();
  const [rs485Configs, setRS485Configs] = useState([]);
  const [activeRS485Tab, setActiveRS485Tab] = useState("0");
  const [openSlaves, setOpenSlaves] = useState({});

  // Create aircon options for combobox
  const airconOptions = (airconCards || []).map((card) => ({
    value: card.address.toString(),
    label:
      card.name && card.name.trim()
        ? `${card.name} (${card.address})`
        : `Aircon ${card.address}`,
  }));

  // Load required data when dialog opens
  useEffect(() => {
    if (open && selectedProject) {
      // Load aircon data if not already loaded
      if (!loadedTabs.has("aircon")) {
        loadTabData(selectedProject.id, "aircon");
      }
    }
  }, [open, selectedProject, loadedTabs, loadTabData]);

  // Initialize configurations
  useEffect(() => {
    if (open) {
      if (config && config.length > 0) {
        setRS485Configs(config);
      } else {
        // Create default configurations
        const defaultConfigs = Array.from({ length: RS485.MAX_CONFIG }, () =>
          createDefaultRS485Config()
        );
        setRS485Configs(defaultConfigs);
      }
      setActiveRS485Tab("0");
      setOpenSlaves({});
    }
  }, [open, config]);

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
      const newIndoorGroup = [
        ...newConfigs[configIndex].slave_cfg[slaveIndex].indoor_group,
      ];
      newIndoorGroup[indoorIndex] = value;
      newConfigs[configIndex].slave_cfg[slaveIndex] = {
        ...newConfigs[configIndex].slave_cfg[slaveIndex],
        indoor_group: newIndoorGroup,
      };
      return newConfigs;
    });
  };

  const handleSave = () => {
    onSave(rs485Configs);
    onOpenChange(false);
  };

  const currentConfig =
    rs485Configs[parseInt(activeRS485Tab)] || createDefaultRS485Config();

  // Check if RS485 type is slave or none
  const isSlaveTypeConfig = isSlaveType(currentConfig.config_type);
  const isNoneTypeConfig = isNoneType(currentConfig.config_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RS485 Configuration</DialogTitle>
          <DialogDescription>
            Configure RS485 communication settings for the unit.
          </DialogDescription>
        </DialogHeader>

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
                        value={
                          config.config_type === 0
                            ? ""
                            : config.config_type.toString()
                        }
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "config_type",
                            value === "" ? 0 : parseInt(value)
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
                {!isNoneTypeConfig && currentConfig.num_slave_devs > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Slave Config</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Array.from(
                        { length: currentConfig.num_slave_devs },
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
                                        currentConfig.slave_cfg[slaveIndex]
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
                                    <Combobox
                                      value={
                                        currentConfig.slave_cfg[slaveIndex]
                                          ?.slave_group === 0
                                          ? ""
                                          : (
                                              currentConfig.slave_cfg[
                                                slaveIndex
                                              ]?.slave_group || 0
                                            ).toString()
                                      }
                                      onValueChange={(value) =>
                                        handleSlaveConfigChange(
                                          configIndex,
                                          slaveIndex,
                                          "slave_group",
                                          value === ""
                                            ? 0
                                            : parseInt(value) || 0
                                        )
                                      }
                                      options={airconOptions}
                                      placeholder="Select aircon"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Number of Indoors (0-16)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={RS485.SLAVE_MAX_INDOORS}
                                      value={
                                        currentConfig.slave_cfg[slaveIndex]
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
                                {currentConfig.slave_cfg[slaveIndex]
                                  ?.num_indoors > 0 && (
                                  <div className="space-y-4">
                                    <Label className="text-base font-semibold">
                                      Indoor Groups
                                    </Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {Array.from(
                                        {
                                          length:
                                            currentConfig.slave_cfg[slaveIndex]
                                              .num_indoors,
                                        },
                                        (_, indoorIndex) => (
                                          <div
                                            key={indoorIndex}
                                            className="space-y-2"
                                          >
                                            <Label>
                                              Indoor #{indoorIndex + 1}
                                            </Label>
                                            <Combobox
                                              value={
                                                currentConfig.slave_cfg[
                                                  slaveIndex
                                                ]?.indoor_group[indoorIndex] ===
                                                0
                                                  ? ""
                                                  : (
                                                      currentConfig.slave_cfg[
                                                        slaveIndex
                                                      ]?.indoor_group[
                                                        indoorIndex
                                                      ] || 0
                                                    ).toString()
                                              }
                                              onValueChange={(value) =>
                                                handleIndoorGroupChange(
                                                  configIndex,
                                                  slaveIndex,
                                                  indoorIndex,
                                                  value === ""
                                                    ? 0
                                                    : parseInt(value) || 0
                                                )
                                              }
                                              options={airconOptions}
                                              placeholder="Select aircon"
                                            />
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
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
