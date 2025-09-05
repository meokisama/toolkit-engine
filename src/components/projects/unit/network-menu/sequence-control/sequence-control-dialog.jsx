"use client";

import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { Play, Trash2, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { DeleteSequenceDialog } from "./delete-sequence-popover";
import { useProjectDetail } from "@/contexts/project-detail-context";

// Initial state for better state management
const initialState = {
  sequenceIndex: "",
  sequences: [],
  showSequences: false,
  deleteConfirmDialog: {
    open: false,
    sequenceIndex: null,
    sequenceName: "",
  },
  deletePopoverOpen: false,
};

const initialLoadingState = {
  loading: false,
  loadingInfo: false,
  loadingAllSequences: false,
};

// Memoized SequenceCard component to prevent unnecessary re-renders
const SequenceCard = memo(({ sequence, onTrigger, onDelete, loading, formatSequenceName }) => (
  <Card key={sequence.sequenceIndex} className="relative">
    <CardContent>
      <div className="flex items-center justify-between">
        <CardTitle className="flex flex-col gap-2">
          <span className="text-lg font-bold">
            {formatSequenceName ? formatSequenceName(sequence) : (sequence.sequenceName || "No name")}
          </span>
          <div className="text-sm text-muted-foreground font-light">
            <span className="font-bold">Sequence:</span> #
            {sequence.sequenceIndex}
            <span className="mx-1"> | </span>
            <span className="font-bold">Address:</span>{" "}
            {sequence.sequenceAddress}
          </div>
        </CardTitle>

        <div className="flex items-center gap-2">
          {/* Multi-Scenes Button with Popover */}
          <Popover modal={true}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <span className="font-light">Multi-Scenes:</span>{" "}
                {sequence.multiSceneCount}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-108" align="end">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium text-sm">
                    {formatSequenceName ? formatSequenceName(sequence) : (sequence.sequenceName || "No name")}
                  </h4>
                  <div className="text-xs text-muted-foreground">
                    <strong>Address:</strong> {sequence.sequenceAddress} |{" "}
                    <strong>Total Multi-Scenes:</strong>{" "}
                    {sequence.multiSceneCount}
                  </div>
                </div>

                {sequence.multiSceneAddresses &&
                  sequence.multiSceneAddresses.length > 0 ? (
                  <div className="space-y-2">
                    <ScrollArea className="h-32 w-full rounded border pr-2">
                      <div className="p-2 space-y-1">
                        {sequence.multiSceneAddresses.map((address, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                          >
                            <span className="font-medium">
                              Multi-Scene Address: {address}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    No multi-scenes configured
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Action Buttons */}
          <Button
            onClick={() => onTrigger(sequence.sequenceAddress)}
            disabled={loading}
            variant="outline"
            size="icon"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
          </Button>

          <Button
            onClick={() =>
              onDelete(sequence.sequenceIndex, sequence.sequenceName)
            }
            disabled={loading}
            variant="outline"
            size="icon"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

export function TriggerSequenceDialog({ open, onOpenChange, unit }) {
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Access project context to get database sequences
  const { selectedProject, projectItems, loadTabData, loadedTabs } = useProjectDetail();

  // Load sequence data when dialog opens if not already loaded
  useEffect(() => {
    if (open && selectedProject && !loadedTabs.has('sequences')) {
      loadTabData(selectedProject.id, 'sequences');
    }
  }, [open, selectedProject, loadedTabs, loadTabData]);

  // Helper function to get database sequence name by address
  const getDatabaseSequenceName = useCallback((address) => {
    if (!selectedProject || !projectItems.sequences) return null;

    const databaseSequence = projectItems.sequences.find(sequence =>
      parseInt(sequence.address) === parseInt(address)
    );

    return databaseSequence ? databaseSequence.name : null;
  }, [selectedProject, projectItems.sequences]);

  // Helper function to format sequence display name
  const formatSequenceName = useCallback((networkSequence) => {
    const networkName = networkSequence.sequenceName || "No name";
    const databaseName = getDatabaseSequenceName(networkSequence.sequenceAddress);

    if (databaseName && networkName !== databaseName) {
      return `${networkName} - ${databaseName}`;
    }

    return networkName;
  }, [getDatabaseSequenceName]);

  // Handle sequence index input change
  const handleSequenceIndexChange = useCallback((value) => {
    setState((prev) => ({ ...prev, sequenceIndex: value }));
  }, []);

  // Handle trigger sequence
  const handleTriggerSequence = useCallback(
    async (sequenceAddress = null) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      // If sequenceAddress is provided (from card), use it directly
      // Otherwise, use the input value as index to find the address
      let addressToTrigger = sequenceAddress;

      if (addressToTrigger === null) {
        // Manual input - treat as index, need to find the address
        if (!state.sequenceIndex) {
          toast.error("Please enter a sequence index");
          return;
        }

        const protocolIndex = parseInt(state.sequenceIndex);
        if (isNaN(protocolIndex) || protocolIndex < 0 || protocolIndex > 19) {
          toast.error("Sequence index must be between 0 and 19");
          return;
        }

        // For manual input, we'll use the index as address (legacy behavior)
        // In a real scenario, you might want to load the sequence first to get the actual address
        addressToTrigger = protocolIndex;
      }

      setLoadingState((prev) => ({ ...prev, loading: true }));
      try {
        console.log("Triggering sequence:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sequenceAddress: addressToTrigger,
        });

        await window.electronAPI.rcuController.triggerSequence({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sequenceAddress: addressToTrigger,
        });

        toast.success(`Sequence (address: ${addressToTrigger}) triggered successfully`);
      } catch (error) {
        console.error("Failed to trigger sequence:", error);
        toast.error(`Failed to trigger sequence: ${error.message}`);
      } finally {
        setLoadingState((prev) => ({ ...prev, loading: false }));
      }
    },
    [unit, state.sequenceIndex]
  );

  // Handle load sequence information
  const handleLoadSequenceInfo = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    if (!state.sequenceIndex) {
      toast.error("Please enter a sequence index");
      return;
    }

    const protocolIndex = parseInt(state.sequenceIndex);
    if (isNaN(protocolIndex) || protocolIndex < 0 || protocolIndex > 19) {
      toast.error("Sequence index must be between 0 and 19");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingInfo: true }));
    try {
      console.log("Loading sequence information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        sequenceIndex: protocolIndex,
      });

      const result =
        await window.electronAPI.rcuController.getSequenceInformation({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sequenceIndex: protocolIndex,
        });

      // Convert single sequence result to card format
      if (result && result.sequences && result.sequences.length > 0) {
        const sequenceData = result.sequences[0];
        const sequenceCard = {
          sequenceIndex: protocolIndex,
          sequenceName: `Sequence ${protocolIndex}`,
          sequenceAddress: sequenceData.address || 0,
          multiSceneCount: sequenceData.amount || 0,
          multiSceneAddresses: sequenceData.multiSceneAddresses || [],
        };

        setState((prev) => ({
          ...prev,
          sequences: [sequenceCard],
          showSequences: true,
        }));
        toast.success(
          `Sequence ${state.sequenceIndex} information loaded successfully`
        );
      } else {
        setState((prev) => ({
          ...prev,
          sequences: [],
          showSequences: false,
        }));
        toast.info(`No sequence found at index ${state.sequenceIndex}`);
      }
    } catch (error) {
      console.error("Failed to load sequence information:", error);
      toast.error(`Failed to load sequence information: ${error.message}`);
      setState((prev) => ({
        ...prev,
        sequences: [],
        showSequences: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingInfo: false }));
    }
  }, [unit, state.sequenceIndex]);

  // Handle load all sequences
  const handleLoadAllSequences = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingAllSequences: true }));
    try {
      console.log("Loading all sequences information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result =
        await window.electronAPI.rcuController.getAllSequencesInformation({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

      if (result && result.sequences && result.sequences.length > 0) {
        // Filter sequences with amount > 0 and convert to card format
        const sequenceCards = result.sequences
          .filter((seq) => seq.amount > 0)
          .map((seq) => ({
            sequenceIndex: seq.index,
            sequenceName: `Sequence ${seq.index}`,
            sequenceAddress: seq.address,
            multiSceneCount: seq.amount,
            multiSceneAddresses: seq.multiSceneAddresses || [],
          }));

        setState((prev) => ({
          ...prev,
          sequences: sequenceCards,
          showSequences: true,
        }));

        if (sequenceCards.length > 0) {
          toast.success(
            `Found ${sequenceCards.length} sequence(s) with multi-scenes configured`
          );
        } else {
          toast.info("No sequences with multi-scenes found");
        }
      } else {
        setState((prev) => ({
          ...prev,
          sequences: [],
          showSequences: false,
        }));
        toast.info("No sequences found");
      }
    } catch (error) {
      console.error("Failed to load all sequences:", error);
      toast.error(`Failed to load sequences: ${error.message}`);
      setState((prev) => ({
        ...prev,
        sequences: [],
        showSequences: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingAllSequences: false }));
    }
  }, [unit]);

  // Handle delete sequence from card
  const handleDeleteSequenceFromCard = useCallback(
    (sequenceIndex, sequenceName) => {
      setState((prev) => ({
        ...prev,
        deleteConfirmDialog: {
          open: true,
          sequenceIndex,
          sequenceName,
        },
      }));
    },
    []
  );

  // Handle trigger sequence from card
  const handleTriggerSequenceFromCard = useCallback(
    (sequenceAddress) => {
      handleTriggerSequence(sequenceAddress);
    },
    [handleTriggerSequence]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Sequence Control - {unit?.type || "Network Unit"} (
              {unit?.ip_address})
            </DialogTitle>
            <DialogDescription>
              Control sequences on the selected network unit.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden space-y-4">
            {/* Controls */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="sequenceIndex"
                    type="number"
                    min="0"
                    max="19"
                    value={state.sequenceIndex}
                    onChange={(e) => handleSequenceIndexChange(e.target.value)}
                    placeholder="Sequence (0-19)"
                    className="w-40"
                  />
                </div>
                <Button
                  onClick={handleLoadSequenceInfo}
                  disabled={loadingState.loading || loadingState.loadingInfo}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ListOrdered className="h-4 w-4" />
                  {loadingState.loadingInfo ? "Loading..." : "Load Sequence"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteSequenceDialog
                  open={state.deletePopoverOpen}
                  onOpenChange={(open) =>
                    setState((prev) => ({ ...prev, deletePopoverOpen: open }))
                  }
                  unit={unit}
                  asPopover={true}
                  trigger={
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Sequences
                    </Button>
                  }
                />
                <Button
                  onClick={handleLoadAllSequences}
                  disabled={
                    loadingState.loadingAllSequences || loadingState.loadingInfo
                  }
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingState.loadingAllSequences
                    ? "Loading..."
                    : "Load All Sequences"}
                </Button>
              </div>
            </div>

            {/* Sequences Display - Always show ScrollArea */}
            <div className="space-y-4">
              <ScrollArea className="h-[450px] w-full rounded-md border p-4">
                {state.showSequences && state.sequences.length > 0 ? (
                  <div className="grid gap-3">
                    {state.sequences.map((sequence) => (
                      <SequenceCard
                        key={sequence.sequenceIndex}
                        sequence={sequence}
                        onTrigger={handleTriggerSequenceFromCard}
                        onDelete={handleDeleteSequenceFromCard}
                        loading={loadingState.loading}
                        formatSequenceName={formatSequenceName}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <ListOrdered className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No sequences loaded</p>
                      <p className="text-sm">
                        Enter a sequence index and click "Load Sequence" or use
                        "Load All Sequences" to see configured sequences.
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
