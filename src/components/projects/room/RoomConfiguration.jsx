import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomStateConfiguration } from "./RoomStateConfiguration";

const ROOM_STATES = [
  "Unrent",
  "Unoccupy",
  "Checkin",
  "Welcome",
  "Welcome Night",
  "Staff",
  "Out Of Service",
];

export function RoomConfiguration({
  roomIndex,
  config,
  updateConfig,
  availableScenes = [],
}) {
  const {
    roomAddress = roomIndex + 1,
    occupancyType = 0, // 0: None, 1: Keycard, 2: Keyless
    occupancySceneType = 0, // 0: Welcome, 1: Restore
    pirInitTime = 0,
    pirVerifyTime = 0,
    unrentPeriod = 0,
    standbyTime = 15,
    period = 0,
    states = {},
  } = config;

  const handleFieldUpdate = (field, value) => {
    updateConfig(roomIndex, field, value);
  };

  const handleStateUpdate = (state, field, value) => {
    const updatedStates = {
      ...states,
      [state]: {
        ...(states[state] || {}),
        [field]: value,
      },
    };
    updateConfig(roomIndex, "states", updatedStates);
  };

  // Determine which fields to show based on occupancy type
  const showOccupancySceneType = occupancyType === 1 || occupancyType === 2; // Keycard or Keyless
  const showPeriod = occupancyType === 1 || occupancyType === 2; // Keycard or Keyless
  const showAllFields = occupancyType === 2; // Keyless only

  return (
    <div>
      <div className="space-y-6">
        {/* Basic Room Settings */}
        <div className="space-y-4 pb-4">
          <h3 className="font-semibold text-sm">1. Basic Settings</h3>
          <div className="grid grid-cols-4 gap-2">
            {/* Room Address */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor={`room-${roomIndex}-address`}
                className="text-right"
              >
                Room Address
              </Label>
              <Select
                value={roomAddress.toString()}
                onValueChange={(value) =>
                  handleFieldUpdate("roomAddress", parseInt(value))
                }
              >
                <SelectTrigger
                  id={`room-${roomIndex}-address`}
                  className="w-full"
                >
                  <SelectValue placeholder="Select room address" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Occupancy Type */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor={`room-${roomIndex}-occupancy`}
                className="text-right"
              >
                Occupancy Type
              </Label>
              <Select
                value={occupancyType.toString()}
                onValueChange={(value) =>
                  handleFieldUpdate("occupancyType", parseInt(value))
                }
              >
                <SelectTrigger
                  id={`room-${roomIndex}-occupancy`}
                  className="w-full"
                >
                  <SelectValue placeholder="Select occupancy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">Keycard</SelectItem>
                  <SelectItem value="2">Keyless</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Occupancy Scene Type - Show for Keycard and Keyless */}
            {showOccupancySceneType && (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`room-${roomIndex}-scene-type`}
                  className="text-right"
                >
                  Occupancy Scene Type
                </Label>
                <Select
                  value={occupancySceneType.toString()}
                  onValueChange={(value) =>
                    handleFieldUpdate("occupancySceneType", parseInt(value))
                  }
                >
                  <SelectTrigger
                    id={`room-${roomIndex}-scene-type`}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select scene type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Welcome</SelectItem>
                    <SelectItem value="1">Restore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Period - Show for Keycard only */}
            {showPeriod && (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`room-${roomIndex}-period`}
                  className="text-right"
                >
                  Period (seconds)
                </Label>
                <Input
                  id={`room-${roomIndex}-period`}
                  type="number"
                  min="0"
                  value={period}
                  onChange={(e) =>
                    handleFieldUpdate("period", parseInt(e.target.value) || 0)
                  }
                  className="col-span-3"
                />
              </div>
            )}
          </div>

          {/* Additional fields - Show for Keyless only */}
          {showAllFields && (
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`room-${roomIndex}-pir-init`}
                  className="text-right"
                >
                  PIR Init Time (seconds)
                </Label>
                <Input
                  id={`room-${roomIndex}-pir-init`}
                  type="number"
                  min="0"
                  value={pirInitTime}
                  onChange={(e) =>
                    handleFieldUpdate(
                      "pirInitTime",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="col-span-3"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`room-${roomIndex}-pir-verify`}
                  className="text-right"
                >
                  PIR Verify Time (seconds)
                </Label>
                <Input
                  id={`room-${roomIndex}-pir-verify`}
                  type="number"
                  min="0"
                  value={pirVerifyTime}
                  onChange={(e) =>
                    handleFieldUpdate(
                      "pirVerifyTime",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="col-span-3"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`room-${roomIndex}-unrent`}
                  className="text-right"
                >
                  Unrent Period (seconds)
                </Label>
                <Input
                  id={`room-${roomIndex}-unrent`}
                  type="number"
                  min="0"
                  value={unrentPeriod}
                  onChange={(e) =>
                    handleFieldUpdate(
                      "unrentPeriod",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="col-span-3"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`room-${roomIndex}-standby`}
                  className="text-right"
                >
                  Standby Time (seconds)
                </Label>
                <Input
                  id={`room-${roomIndex}-standby`}
                  type="number"
                  min="0"
                  value={standbyTime}
                  onChange={(e) =>
                    handleFieldUpdate(
                      "standbyTime",
                      parseInt(e.target.value) || 15
                    )
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
        </div>

        {/* Room States Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">2. State Configurations</h3>
          <Tabs defaultValue={ROOM_STATES[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {ROOM_STATES.map((state) => (
                <TabsTrigger key={state} value={state}>
                  {state.replace(" ", "\n")}
                </TabsTrigger>
              ))}
            </TabsList>
            {ROOM_STATES.map((state) => (
              <TabsContent key={state} value={state} className="mt-4">
                <RoomStateConfiguration
                  state={state}
                  config={states[state] || {}}
                  updateConfig={handleStateUpdate}
                  availableScenes={availableScenes}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
