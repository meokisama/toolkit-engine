import React, { memo, useMemo } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

/**
 * Optimized Base Control Card
 */
export const BaseControlCard = memo(({
  item,
  title,
  metadata = [],
  actions = [],
  loading = false,
  onDelete,
  className = "",
  children,
}) => {
  // Memoize metadata rendering
  const metadataContent = useMemo(() => {
    if (metadata.length === 0) return null;

    return (
      <div className="text-sm text-muted-foreground font-light space-y-1">
        {metadata.map((meta, index) => (
          <div key={index}>
            {meta.label && <><span className="font-bold">{meta.label}:</span> </>}
            {meta.content}
            {meta.separator && index < metadata.length - 1 && <span className="mx-1"> | </span>}
          </div>
        ))}
      </div>
    );
  }, [metadata]);

  // Memoize action buttons
  const actionButtons = useMemo(() =>
    actions.map((action, index) => (
      <Button
        key={index}
        variant={action.variant || "outline"}
        size={action.size || "icon"}
        onClick={action.onClick}
        disabled={loading || action.disabled}
        className={`flex items-center gap-1 shadow ${action.className || ""}`}
        title={action.title}
      >
        {action.icon}
        {action.label && <span>{action.label}</span>}
      </Button>
    )), [actions, loading]);

  return (
    <Card className={`relative ${className}`}>
      <CardContent>
        <div className="flex items-center justify-between">
          <CardTitle className="flex flex-col gap-2">
            <span className="text-lg font-bold">{title}</span>
            {metadataContent}
          </CardTitle>

          <div className="flex items-center gap-2">
            {actionButtons}
            {onDelete && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(item.index, item.name || `Item ${item.index}`)}
                disabled={loading}
                className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}, (prev, next) => {
  return (
    prev.loading === next.loading &&
    prev.title === next.title &&
    prev.item.index === next.item.index &&
    prev.metadata.length === next.metadata.length &&
    prev.actions.length === next.actions.length
  );
});

BaseControlCard.displayName = "BaseControlCard";
