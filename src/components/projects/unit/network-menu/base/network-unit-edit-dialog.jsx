import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Cable } from "lucide-react";
import { NetworkRS485ConfigDialog } from "@/components/projects/unit/network-menu/rs485-control/network-rs485-config-dialog";

export function NetworkUnitEditDialog({
  open,
  onOpenChange,
  unit,
  onUnitUpdated,
}) {
  const [formData, setFormData] = useState({
    ip_address: "",
    id_can: "",
    id_can_last_part: "",
    mode: "Stand-Alone",
    can_load: false,
    recovery_mode: false,
  });
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [rs485ConfigDialogOpen, setRS485ConfigDialogOpen] = useState(false);

  // Initialize form data when unit changes
  useEffect(() => {
    if (unit) {
      const canIdParts = (unit.id_can || "").split(".");
      const lastPart = canIdParts.length === 4 ? canIdParts[3] : "";

      const data = {
        ip_address: unit.ip_address || "",
        id_can: unit.id_can || "",
        id_can_last_part: lastPart,
        mode: unit.mode || "Stand-Alone",
        can_load: unit.can_load || false,
        recovery_mode: unit.recovery_mode || false,
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [unit]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        ip_address: "",
        id_can: "",
        id_can_last_part: "",
        mode: "Stand-Alone",
        can_load: false,
        recovery_mode: false,
      });
      setOriginalData({});
    }
  }, [open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(formData.ip_address)) {
      toast.error("Please enter a valid IP address");
      return false;
    }

    // Validate IP address range (0-255 for each octet)
    const ipParts = formData.ip_address.split(".");
    for (const part of ipParts) {
      const num = parseInt(part);
      if (num < 0 || num > 255) {
        toast.error("IP address octets must be between 0-255");
        return false;
      }
    }

    // Validate CAN ID last part (1-255)
    const lastPart = parseInt(formData.id_can_last_part);
    if (isNaN(lastPart) || lastPart < 1 || lastPart > 255) {
      toast.error("CAN ID last part must be a number between 1-255");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const changes = {};
      let hasChanges = false;

      // Check for IP address change
      if (formData.ip_address !== originalData.ip_address) {
        changes.ip_address = formData.ip_address;
        hasChanges = true;
      }

      // Check for CAN ID change
      if (formData.id_can_last_part !== originalData.id_can_last_part) {
        // Build new CAN ID with updated last part
        const originalCanIdParts = originalData.id_can.split(".");
        const newCanId = `${originalCanIdParts[0]}.${originalCanIdParts[1]}.${originalCanIdParts[2]}.${formData.id_can_last_part}`;
        changes.id_can = newCanId;
        changes.id_can_last_part = parseInt(formData.id_can_last_part);
        hasChanges = true;
      }

      // Check for hardware config changes (mode, can_load, recovery_mode)
      if (
        formData.mode !== originalData.mode ||
        formData.can_load !== originalData.can_load ||
        formData.recovery_mode !== originalData.recovery_mode
      ) {
        changes.hardware_config = {
          mode: formData.mode,
          can_load: formData.can_load,
          recovery_mode: formData.recovery_mode,
        };
        hasChanges = true;
      }

      if (!hasChanges) {
        toast.info("No changes detected");
        onOpenChange(false);
        return;
      }

      // Apply changes sequentially
      if (changes.ip_address) {
        await changeIpAddress(
          unit.ip_address,
          formData.ip_address,
          unit.id_can
        );
      }

      if (changes.id_can) {
        const currentIp = changes.ip_address || unit.ip_address;
        await changeCanId(currentIp, changes.id_can_last_part, unit.id_can);
      }

      if (changes.hardware_config) {
        const currentIp = changes.ip_address || unit.ip_address;
        const currentCanId = changes.id_can || unit.id_can;
        await changeHardwareConfig(
          currentIp,
          currentCanId,
          changes.hardware_config
        );
      }

      // Update the unit data
      const updatedUnit = {
        ...unit,
        ip_address: formData.ip_address,
        id_can: changes.id_can || unit.id_can,
        mode: formData.mode,
        can_load: formData.can_load,
        recovery_mode: formData.recovery_mode,
      };

      onUnitUpdated(updatedUnit);
      toast.success("Network unit updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update network unit:", error);
      toast.error(`Failed to update network unit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const changeIpAddress = async (oldIp, newIp, canId) => {
    // Convert IP addresses to byte arrays
    const oldIpBytes = oldIp.split(".").map((part) => parseInt(part));
    const newIpBytes = newIp.split(".").map((part) => parseInt(part));

    // Data: 4 bytes new IP + 4 bytes old IP
    const data = [...newIpBytes, ...oldIpBytes];

    const response = await window.electronAPI.rcuController.changeIpAddress({
      unitIp: oldIp,
      canId: canId,
      data: data,
    });

    if (!response.result.success) {
      throw new Error("Failed to change IP address");
    }
  };

  const changeCanId = async (unitIp, newLastPart, oldCanId) => {
    const response = await window.electronAPI.rcuController.changeCanId({
      unitIp: unitIp,
      canId: oldCanId,
      newLastPart: newLastPart,
    });

    if (!response.result.success) {
      throw new Error("Failed to change CAN ID");
    }
  };

  const changeHardwareConfig = async (unitIp, canId, config) => {
    // Build hardware config byte
    let configByte = 0;

    // 2 bits for action mode (0: Stand-Alone, 1: Slave, 2: Master)
    const modeMap = {
      "Stand-Alone": 0,
      Slave: 1,
      Master: 2,
    };
    configByte |= (modeMap[config.mode] || 0) & 0x03;

    // Bit 2 for CAN Load
    if (config.can_load) {
      configByte |= 0x04;
    }

    // Bit 6 for recovery
    if (config.recovery_mode) {
      configByte |= 0x40;
    }

    const response = await window.electronAPI.rcuController.setHardwareConfig({
      unitIp: unitIp,
      canId: canId,
      configByte: configByte,
    });

    if (!response.result.success) {
      throw new Error("Failed to change hardware configuration");
    }
  };

  // Handle RS485 Config
  const handleRS485Config = () => {
    setRS485ConfigDialogOpen(true);
  };

  if (!unit) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Network Unit</DialogTitle>
            <DialogDescription>
              Modify the network unit configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ip_address" className="text-right">
                  IP Address
                </Label>
                <Input
                  id="ip_address"
                  value={formData.ip_address}
                  onChange={(e) =>
                    handleInputChange("ip_address", e.target.value)
                  }
                  placeholder="192.168.1.100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="id_can" className="text-right">
                  CAN ID
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    className="text-muted-foreground w-20 tracking-[2px] text-center"
                    readOnly
                    value={
                      formData.id_can
                        ? formData.id_can.split(".").slice(0, 3).join(".") + "."
                        : "0.0.1."
                    }
                  />
                  <Input
                    id="id_can_last_part"
                    type="number"
                    min="1"
                    max="255"
                    value={formData.id_can_last_part}
                    onChange={(e) =>
                      handleInputChange("id_can_last_part", e.target.value)
                    }
                    className="w-15 text-center [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mode" className="text-right">
                Mode
              </Label>
              <Select
                value={formData.mode}
                onValueChange={(value) => handleInputChange("mode", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stand-Alone">Stand-Alone</SelectItem>
                  <SelectItem value="Slave">Slave</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-row gap-2">
                <Checkbox
                  id="can_load"
                  checked={formData.can_load}
                  onCheckedChange={(checked) =>
                    handleInputChange("can_load", checked)
                  }
                />
                <Label htmlFor="can_load">CAN Load</Label>
              </div>

              <div className="flex flex-row gap-2">
                <Checkbox
                  id="recovery_mode"
                  checked={formData.recovery_mode}
                  onCheckedChange={(checked) =>
                    handleInputChange("recovery_mode", checked)
                  }
                />
                <Label htmlFor="recovery_mode">Line Cut Recovery</Label>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRS485Config}
              className="flex items-center gap-2 w-full"
            >
              <Cable className="h-4 w-4" />
              RS485 Configuration
            </Button>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RS485 Configuration Dialog */}
      <NetworkRS485ConfigDialog
        open={rs485ConfigDialogOpen}
        onOpenChange={setRS485ConfigDialogOpen}
        unit={unit}
      />
    </>
  );
}
