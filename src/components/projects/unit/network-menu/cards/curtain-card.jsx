import React, { memo, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, Square } from "lucide-react";
import { BaseControlCard } from "@/components/shared/base-control-card";
import { CURTAIN_TYPE_LABELS } from "@/constants";

/**
 * Optimized Curtain Card
 */
export const CurtainCard = memo(({
  item: curtain,
  onControl,
  onDelete,
  loading = false,
}) => {
  const title = useMemo(() => `Curtain #${curtain.index}`, [curtain.index]);

  const curtainTypeLabel = useMemo(() =>
    CURTAIN_TYPE_LABELS[curtain.curtainType] || `Unknown (${curtain.curtainType})`,
    [curtain.curtainType]
  );

  const metadata = useMemo(() => [
    {
      content: (
        <p>
          <span className="font-bold">Groups:</span> Open: {curtain.openGroup},
          Close: {curtain.closeGroup}, Stop: {curtain.stopGroup}
        </p>
      ),
    },
    {
      content: (
        <p>
          <span className="font-bold">Type:</span> {curtainTypeLabel}
          <span className="mx-1"> | </span>
          <span className="font-bold">Address:</span> {curtain.address}
        </p>
      ),
    },
  ], [curtain.openGroup, curtain.closeGroup, curtain.stopGroup, curtainTypeLabel, curtain.address]);

  const handleStop = useCallback(() => {
    onControl(curtain.address, 0);
  }, [onControl, curtain.address]);

  const handleOpen = useCallback(() => {
    onControl(curtain.address, 1);
  }, [onControl, curtain.address]);

  const handleClose = useCallback(() => {
    onControl(curtain.address, 2);
  }, [onControl, curtain.address]);

  const actions = useMemo(() => [
    {
      icon: <Square className="h-3 w-3" />,
      onClick: handleStop,
      title: "Stop",
    },
    {
      icon: <ChevronUp className="h-3 w-3" />,
      onClick: handleOpen,
      title: "Open",
    },
    {
      icon: <ChevronDown className="h-3 w-3" />,
      onClick: handleClose,
      title: "Close",
    },
  ], [handleStop, handleOpen, handleClose]);

  return (
    <BaseControlCard
      item={curtain}
      title={title}
      metadata={metadata}
      actions={actions}
      loading={loading}
      onDelete={onDelete}
    />
  );
}, (prev, next) => {
  return (
    prev.item.index === next.item.index &&
    prev.item.address === next.item.address &&
    prev.item.curtainType === next.item.curtainType &&
    prev.item.openGroup === next.item.openGroup &&
    prev.item.closeGroup === next.item.closeGroup &&
    prev.item.stopGroup === next.item.stopGroup &&
    prev.loading === next.loading
  );
});

CurtainCard.displayName = "CurtainCard";
