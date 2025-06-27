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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";
import { getUnitIOSpec, getOutputTypes } from "@/utils/io-config-utils";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";
import { toast } from "sonner";

// Memoized input item component to prevent unnecessary re-renders
const InputStateItem = React.memo(({ input }) => (
  <div
    key={input.index}
    className="flex items-center justify-between p-3 border rounded-lg"
  >
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-between gap-2">
        <img
          src={input.isActive > 0 ? lightOn : lightOff}
          alt="Lighting State"
          className="w-[30px] h-auto rounded-lg"
        />
        <span className="font-medium">{input.name}</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground">Index: {input.index}</div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          // TODO: Open input configuration dialog
          toast.info("Input configuration coming soon");
        }}
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
));

InputStateItem.displayName = "InputStateItem";

// Memoized output item component to prevent unnecessary re-renders
const OutputStateItem = React.memo(({ output, onToggleState }) => (
  <div
    key={output.index}
    className="flex items-center justify-between p-3 border rounded-lg"
  >
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-between gap-2">
        <img
          src={output.state ? lightOn : lightOff}
          alt="Output State"
          className="w-[30px] h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onToggleState(output.index, output.state)}
        />
        <span className="font-medium">{output.name}</span>
      </div>
      <Badge variant="outline" className="text-xs">
        {output.type.toUpperCase()}
      </Badge>
      {output.brightness !== undefined && (
        <Badge variant="secondary" className="text-xs">
          {Math.round((output.brightness / 255) * 100)}%
        </Badge>
      )}
    </div>
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground">Index: {output.index}</div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          // TODO: Open output configuration dialog
          toast.info("Output configuration coming soon");
        }}
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
));

OutputStateItem.displayName = "OutputStateItem";

const NetworkIOConfigDialog = ({ open, onOpenChange, item = null }) => {
  const [inputStates, setInputStates] = useState([]);
  const [outputStates, setOutputStates] = useState([]);

  // Use refs to store current state without triggering re-renders
  const inputStatesRef = useRef([]);
  const outputStatesRef = useRef([]);
  const refreshIntervalRef = useRef(null);

  // Get I/O specifications for the unit
  const ioSpec = useMemo(() => {
    return item?.type ? getUnitIOSpec(item.type) : null;
  }, [item?.type]);

  const outputTypes = useMemo(() => {
    return item?.type ? getOutputTypes(item.type) : [];
  }, [item?.type]);

  // Initialize input and output arrays based on unit specs
  useEffect(() => {
    if (ioSpec && open) {
      // Initialize inputs
      const inputs = [];
      for (let i = 0; i < ioSpec.inputs; i++) {
        inputs.push({
          index: i,
          name: `Input ${i + 1}`,
          brightness: 0,
          isActive: false,
        });
      }
      setInputStates(inputs);
      inputStatesRef.current = inputs;

      // Initialize outputs
      const outputs = [];
      let outputIndex = 0;
      outputTypes.forEach(({ type, count }) => {
        for (let i = 0; i < count; i++) {
          outputs.push({
            index: outputIndex++,
            name: `${type === "ac" ? "AC" : "Lighting"} ${i + 1}`,
            type: type,
            state: false,
            brightness: 0,
          });
        }
      });
      setOutputStates(outputs);
      outputStatesRef.current = outputs;
    }
  }, [ioSpec, outputTypes, open]);

  // Function to read input states from the unit (silent background operation)
  const readInputStatesBackground = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return;
    }

    try {
      const response = await window.electronAPI.rcuController.getAllInputStates(
        {
          unitIp: item.ip_address,
          canId: item.id_can,
        }
      );

      if (response.success && response.inputStates) {
        // Update ref first to avoid re-renders
        const updatedInputs = inputStatesRef.current.map((input, index) => {
          const stateData = response.inputStates[index];
          return stateData
            ? {
                ...input,
                brightness: stateData.brightness,
                isActive: stateData.isActive,
              }
            : input;
        });

        // Only update state if there are actual changes
        const hasChanges = updatedInputs.some((input, index) => {
          const current = inputStatesRef.current[index];
          return (
            current &&
            (current.brightness !== input.brightness ||
              current.isActive !== input.isActive)
          );
        });

        if (hasChanges) {
          inputStatesRef.current = updatedInputs;
          // Use functional update to avoid stale closure issues
          setInputStates(() => [...updatedInputs]);
        }
      }
    } catch (error) {
      // Silent error handling - only log to console to avoid UI disruption
      console.warn("Background input state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read output states from the unit (silent background operation)
  const readOutputStatesBackground = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return;
    }

    try {
      const response =
        await window.electronAPI.rcuController.getAllOutputStates({
          unitIp: item.ip_address,
          canId: item.id_can,
        });

      if (response.success && response.outputStates) {
        // Update ref first to avoid re-renders
        const updatedOutputs = outputStatesRef.current.map((output, index) => {
          const stateData = response.outputStates[index];
          return stateData
            ? {
                ...output,
                brightness: stateData.brightness,
                state: stateData.isActive,
              }
            : output;
        });

        // Only update state if there are actual changes
        const hasChanges = updatedOutputs.some((output, index) => {
          const current = outputStatesRef.current[index];
          return (
            current &&
            (current.brightness !== output.brightness ||
              current.state !== output.state)
          );
        });

        if (hasChanges) {
          outputStatesRef.current = updatedOutputs;
          // Use functional update to avoid stale closure issues
          setOutputStates(() => [...updatedOutputs]);
        }
      }
    } catch (error) {
      // Silent error handling - only log to console to avoid UI disruption
      console.warn("Background output state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Sequential read function to ensure input completes before output
  const readStatesSequentially = useCallback(async () => {
    try {
      // Read input states first and wait for completion
      await readInputStatesBackground();
      // Only read output states after input is completely done
      await readOutputStatesBackground();
    } catch (error) {
      console.warn("Sequential state read failed:", error.message);
    }
  }, [readInputStatesBackground, readOutputStatesBackground]);

  // Function to toggle output state
  const handleToggleOutputState = useCallback(
    async (outputIndex, currentState) => {
      if (!item?.ip_address || !item?.id_can) {
        return;
      }

      try {
        // Toggle state: if currently on (true), send 0 to turn off; if off (false), send 255 to turn on
        const newValue = currentState ? 0 : 255;

        const response = await window.electronAPI.rcuController.setOutputState({
          unitIp: item.ip_address,
          canId: item.id_can,
          outputIndex: outputIndex,
          value: newValue,
        });

        if (response) {
          toast.success(
            `Output ${outputIndex + 1} ${
              currentState ? "turned off" : "turned on"
            }`
          );
          // Immediately read states to update UI
          await readStatesSequentially();
        }
      } catch (error) {
        console.error("Failed to toggle output state:", error);
        toast.error(
          `Failed to toggle output ${outputIndex + 1}: ${error.message}`
        );
      }
    },
    [item?.ip_address, item?.id_can, readStatesSequentially]
  );

  // Auto-refresh input and output states every 1 second when dialog is open (sequential operation)
  useEffect(() => {
    if (!open || !item) {
      // Clear any existing interval when dialog closes
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Initial sequential read
    readStatesSequentially();

    // Set up background auto-refresh every 1 second with sequential execution
    refreshIntervalRef.current = setInterval(() => {
      readStatesSequentially();
    }, 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [open, item, readStatesSequentially]);

  if (!item || !ioSpec) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Network I/O Configuration - {item.type}
            <Badge variant="outline" className="ml-2">
              {item.ip_address}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Input Configuration */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  Input Configuration ({ioSpec.inputs} inputs)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-3 pr-4">
                    {inputStates.map((input) => (
                      <InputStateItem key={input.index} input={input} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Output Configuration */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  Output Configuration ({outputStates.length} outputs)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-3 pr-4">
                    {outputStates.map((output) => (
                      <OutputStateItem
                        key={output.index}
                        output={output}
                        onToggleState={handleToggleOutputState}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(NetworkIOConfigDialog);
