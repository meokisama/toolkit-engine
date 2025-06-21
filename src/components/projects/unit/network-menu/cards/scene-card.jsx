import React, { memo, useMemo, useCallback } from "react";
import { Play } from "lucide-react";
import { BaseControlCard } from "@/components/shared/base-control-card";

/**
 * Optimized Scene Card
 */
export const SceneCard = memo(({
  item: scene,
  onTrigger,
  onDelete,
  loading = false,
}) => {
  const title = useMemo(() => scene.name || "No name", [scene.name]);

  const metadata = useMemo(() => [
    {
      label: "Scene",
      content: `#${scene.index}`,
      separator: true,
    },
    {
      label: "Group",
      content: scene.address,
    },
  ], [scene.index, scene.address]);

  const handleTrigger = useCallback(() => {
    onTrigger(scene.index, scene.address);
  }, [onTrigger, scene.index, scene.address]);

  const actions = useMemo(() => [
    {
      icon: <Play className="h-3 w-3" />,
      onClick: handleTrigger,
      title: "Trigger Scene",
    },
  ], [handleTrigger]);

  return (
    <BaseControlCard
      item={scene}
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
    prev.item.name === next.item.name &&
    prev.item.address === next.item.address &&
    prev.loading === next.loading
  );
});

SceneCard.displayName = "SceneCard";
