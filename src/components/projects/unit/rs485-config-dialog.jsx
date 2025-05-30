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
import { Combobox } from "@/components/ui/combobox";
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
  createDefaultSlaveConfig,
  isSlaveType,
  isNoneType,
} from "@/utils/rs485-utils";

const { RS485 } = CONSTANTS;

export function RS485ConfigDialog({ open, onOpenChange, config, onSave }) {
  const { airconCards } = useProjectDetail();
  const [rs485Configs, setRS485Configs] = useState([]);
  const [activeRS485Tab, setActiveRS485Tab] = useState("0");
  const [openSlaves, setOpenSlaves] = useState({});

  // Create aircon options for combobox
  const airconOptions = [
    { value: "0", label: "<Unused>" },
    ...(airconCards || []).map((card) => ({
      value: card.address.toString(),
      label:
        card.name && card.name.trim()
          ? `${card.name} (${card.address})`
          : `Aircon ${card.address}`,
    })),
  ];

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
      [slaveIndex]: !prev[slaveIndex],
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
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Baudrate</Label>
                      <Combobox
                        value={config.baudrate.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "baudrate",
                            parseInt(value)
                          )
                        }
                        options={RS485.BAUDRATES.map((rate) => ({
                          value: rate.value.toString(),
                          label: rate.label,
                        }))}
                        placeholder="Select baudrate"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Parity</Label>
                      <Combobox
                        value={config.parity.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "parity",
                            parseInt(value)
                          )
                        }
                        options={RS485.PARITY.map((parity) => ({
                          value: parity.value.toString(),
                          label: parity.label,
                        }))}
                        placeholder="Select parity"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Stop Bit</Label>
                      <Combobox
                        value={config.stop_bit.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "stop_bit",
                            parseInt(value)
                          )
                        }
                        options={RS485.STOP_BITS.map((bit) => ({
                          value: bit.value.toString(),
                          label: bit.label,
                        }))}
                        placeholder="Select stop bit"
                      />
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
                        onChange={(e) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "board_id",
                            parseInt(e.target.value) || 1
                          )
                        }
                        disabled={isNoneTypeConfig}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Num Slaves</Label>
                      <Combobox
                        value={config.num_slave_devs.toString()}
                        onValueChange={(value) =>
                          handleRS485ConfigChange(
                            configIndex,
                            "num_slave_devs",
                            parseInt(value)
                          )
                        }
                        options={Array.from(
                          { length: RS485.SLAVE_MAX_DEVS + 1 },
                          (_, i) => ({
                            value: i.toString(),
                            label: i.toString(),
                          })
                        )}
                        placeholder="Select number of slaves"
                        disabled={isNoneTypeConfig || isSlaveTypeConfig}
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
                            open={openSlaves[slaveIndex]}
                            onOpenChange={() => toggleSlave(slaveIndex)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex w-full justify-between p-4 h-auto"
                              >
                                <span className="font-medium">
                                  Slave {slaveIndex + 1}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    openSlaves[slaveIndex] ? "rotate-180" : ""
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-4">
                              <div className="space-y-4 pl-4 border-l-2 border-muted">
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
                                      onChange={(e) =>
                                        handleSlaveConfigChange(
                                          configIndex,
                                          slaveIndex,
                                          "slave_id",
                                          parseInt(e.target.value) || 1
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Slave Group</Label>
                                    <Combobox
                                      value={(
                                        currentConfig.slave_cfg[slaveIndex]
                                          ?.slave_group || 0
                                      ).toString()}
                                      onValueChange={(value) =>
                                        handleSlaveConfigChange(
                                          configIndex,
                                          slaveIndex,
                                          "slave_group",
                                          parseInt(value) || 0
                                        )
                                      }
                                      options={airconOptions}
                                      placeholder="Select aircon"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Num Indoors</Label>
                                    <Combobox
                                      value={(
                                        currentConfig.slave_cfg[slaveIndex]
                                          ?.num_indoors || 0
                                      ).toString()}
                                      onValueChange={(value) =>
                                        handleSlaveConfigChange(
                                          configIndex,
                                          slaveIndex,
                                          "num_indoors",
                                          parseInt(value)
                                        )
                                      }
                                      options={Array.from(
                                        { length: RS485.SLAVE_MAX_INDOORS + 1 },
                                        (_, i) => ({
                                          value: i.toString(),
                                          label: i.toString(),
                                        })
                                      )}
                                      placeholder="Select number of indoors"
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
                                              In{indoorIndex + 1} Group
                                            </Label>
                                            <Combobox
                                              value={(
                                                currentConfig.slave_cfg[
                                                  slaveIndex
                                                ]?.indoor_group[indoorIndex] ||
                                                0
                                              ).toString()}
                                              onValueChange={(value) =>
                                                handleIndoorGroupChange(
                                                  configIndex,
                                                  slaveIndex,
                                                  indoorIndex,
                                                  parseInt(value) || 0
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
