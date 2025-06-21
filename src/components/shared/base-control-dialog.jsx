import React, { memo, useMemo, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompare, List, Trash2, Loader2 } from "lucide-react";
import { useControlDialog } from "@/hooks/useControlDialog";

/**
 * Optimized Base Control Dialog
 */
export const BaseControlDialog = memo(({
  open,
  onOpenChange,
  unit,
  entityConfig,
  renderCard,
  DeleteComponent,
  emptyStateMessage,
  className = "",
}) => {
  const {
    entityName,
    entityNameSingular,
    entityNamePlural,
    indexRange,
  } = entityConfig;

  const {
    state,
    loadingState,
    setState,
    handlers: {
      handleIndexChange,
      handleKeyPress,
      handleLoadSingle,
      handleLoadAll,
      handleDeleteFromCard,
    },
  } = useControlDialog(entityConfig, unit, open);

  // Memoized values
  const [minIndex, maxIndex] = indexRange;
  const indexPlaceholder = useMemo(() =>
    `${entityNameSingular} (${minIndex}-${maxIndex})`,
    [entityNameSingular, minIndex, maxIndex]
  );

  const dialogDescription = useMemo(() =>
    `Load and manage ${entityNamePlural.toLowerCase()} on unit ${unit?.ip_address} (CAN ID: ${unit?.id_can}).`,
    [entityNamePlural, unit?.ip_address, unit?.id_can]
  );

  // Memoized button states
  const buttonStates = useMemo(() => ({
    loadSingleDisabled: loadingState.loadingInfo || !state.itemIndex || loadingState.loadingAll,
    loadAllDisabled: loadingState.loadingAll || loadingState.loadingInfo,
    closeDisabled: loadingState.loading || loadingState.loadingInfo || loadingState.loadingAll,
  }), [loadingState, state.itemIndex]);

  // Optimized delete popover handler
  const handleDeletePopoverChange = useCallback((open) => {
    setState((prev) => ({ ...prev, deletePopoverOpen: open }));
  }, [setState]);

  // Memoized content
  const itemsContent = useMemo(() => {
    if (state.showItems && state.items.length > 0) {
      return (
        <div className="grid gap-3">
          {state.items.map((item, index) =>
            renderCard({
              key: `${item.index}-${index}`,
              item,
              onDelete: handleDeleteFromCard,
              loading: loadingState.loading,
            })
          )}
        </div>
      );
    }

    if (state.showItems) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>No {entityNamePlural.toLowerCase()} found.</p>
          <p className="text-sm">
            Try loading a specific {entityNameSingular.toLowerCase()} index or all {entityNamePlural.toLowerCase()}.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center text-muted-foreground py-8">
        {emptyStateMessage || (
          <p>Load {entityNameSingular.toLowerCase()} information to see available {entityNamePlural.toLowerCase()}.</p>
        )}
      </div>
    );
  }, [state.showItems, state.items, renderCard, handleDeleteFromCard, loadingState.loading, entityNamePlural, entityNameSingular, emptyStateMessage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[900px] max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle>{entityName} Control</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={state.itemIndex}
                  onChange={handleIndexChange}
                  onKeyPress={handleKeyPress}
                  placeholder={indexPlaceholder}
                  disabled={buttonStates.closeDisabled}
                  autoFocus
                  className="max-w-[150px]"
                />
                <Button
                  onClick={handleLoadSingle}
                  disabled={buttonStates.loadSingleDisabled}
                  className="flex items-center gap-2"
                >
                  {loadingState.loadingInfo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitCompare className="h-4 w-4" />
                  )}
                  {loadingState.loadingInfo ? "Loading..." : `Load ${entityNameSingular}`}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {DeleteComponent && (
                  <DeleteComponent
                    open={state.deletePopoverOpen}
                    onOpenChange={handleDeletePopoverChange}
                    unit={unit}
                    asPopover={true}
                    trigger={
                      <Button variant="outline" size="lg" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete {entityNamePlural}
                      </Button>
                    }
                  />
                )}

                <Button
                  onClick={handleLoadAll}
                  size="lg"
                  disabled={buttonStates.loadAllDisabled}
                  className="flex items-center gap-2"
                >
                  {loadingState.loadingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                  {loadingState.loadingAll ? "Loading..." : `Load All ${entityNamePlural}`}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {itemsContent}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={buttonStates.closeDisabled}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}, (prev, next) => {
  return (
    prev.open === next.open &&
    prev.unit?.ip_address === next.unit?.ip_address &&
    prev.unit?.id_can === next.unit?.id_can &&
    prev.entityConfig === next.entityConfig
  );
});

BaseControlDialog.displayName = "BaseControlDialog";
