import React, { useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ToggleLeft, Pencil } from "lucide-react";
import { SWITCH_TYPES, SWITCH_INPUT_COUNTS, SWITCH_ENUM_BY_TYPE, SWITCH_TYPE_BY_ENUM } from "@/constants/com-switch-types";
export { SWITCH_TYPES, SWITCH_INPUT_COUNTS, SWITCH_ENUM_BY_TYPE, SWITCH_TYPE_BY_ENUM };

/**
 * Generate input config entries for a list of switch configs.
 * Indices start from baseInputCount and continue sequentially.
 */
export function generateSwitchInputConfigs(switchConfigs, baseInputCount) {
  let currentIndex = baseInputCount;
  const inputs = [];
  switchConfigs.forEach((sw) => {
    const count = SWITCH_INPUT_COUNTS[sw.type] || 1;
    for (let i = 0; i < count; i++) {
      inputs.push({
        index: currentIndex++,
        name: `${sw.name} (${i + 1})`,
        functionValue: 0,
        lightingId: null,
        isSwitchInput: true,
        switchLocalId: sw.localId,
      });
    }
  });
  return inputs;
}

function getAutoName(type, existingSwitches, excludeLocalId = null) {
  const sameType = existingSwitches.filter((sw) => sw.type === type && sw.localId !== excludeLocalId);
  if (sameType.length === 0) return type;
  return `${type} ${sameType.length + 1}`;
}

const DEFAULT_FORM = { channel: "1", type: "", name: "", switchId: "", keyId: "" };

const SwitchForm = ({ title, form, setForm, onTypeChange, onConfirm, onCancel, confirmLabel, disableConfirm }) => (
  <div className="space-y-2.5">
    <h5 className="text-sm font-medium">{title}</h5>

    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Channel</Label>
        <Select value={form.channel} onValueChange={(v) => setForm((prev) => ({ ...prev, channel: v }))}>
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Type</Label>
        <Select value={form.type} onValueChange={onTypeChange}>
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {SWITCH_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="space-y-1">
      <Label className="text-xs">Name</Label>
      <Input
        className="h-8"
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="Switch name..."
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Switch ID</Label>
        <Input
          className="h-8"
          value={form.switchId}
          onChange={(e) => setForm((prev) => ({ ...prev, switchId: e.target.value }))}
          placeholder="Switch ID"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Key ID</Label>
        <Input className="h-8" value={form.keyId} onChange={(e) => setForm((prev) => ({ ...prev, keyId: e.target.value }))} placeholder="Key ID" />
      </div>
    </div>

    <div className="flex gap-2">
      <Button size="sm" className="flex-1" onClick={onConfirm} disabled={disableConfirm}>
        {confirmLabel}
      </Button>
      <Button variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  </div>
);

export const ComSwitchPopover = ({ switchConfigs = [], onAddSwitch, onRemoveSwitch, onUpdateSwitch }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // null | "add" | "edit"
  const [editingLocalId, setEditingLocalId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const handleOpenAdd = useCallback(() => {
    setForm(DEFAULT_FORM);
    setEditingLocalId(null);
    setMode("add");
  }, []);

  const handleOpenEdit = useCallback((sw) => {
    setForm({
      channel: sw.channel.toString(),
      type: sw.type,
      name: sw.name,
      switchId: sw.switchId || "",
      keyId: sw.keyId || "",
    });
    setEditingLocalId(sw.localId);
    setMode("edit");
  }, []);

  const handleTypeChange = useCallback(
    (type) => {
      const autoName = getAutoName(type, switchConfigs, editingLocalId);
      setForm((prev) => ({ ...prev, type, name: autoName }));
    },
    [switchConfigs, editingLocalId],
  );

  const handleCreate = useCallback(() => {
    if (!form.type) return;
    onAddSwitch({
      localId: crypto.randomUUID(),
      channel: parseInt(form.channel),
      type: form.type,
      name: form.name || getAutoName(form.type, switchConfigs),
      switchId: form.switchId,
      keyId: form.keyId,
    });
    setForm(DEFAULT_FORM);
    setMode(null);
  }, [form, switchConfigs, onAddSwitch]);

  const handleSave = useCallback(() => {
    if (!form.type || !editingLocalId) return;
    onUpdateSwitch({
      localId: editingLocalId,
      channel: parseInt(form.channel),
      type: form.type,
      name: form.name || getAutoName(form.type, switchConfigs, editingLocalId),
      switchId: form.switchId,
      keyId: form.keyId,
    });
    setForm(DEFAULT_FORM);
    setEditingLocalId(null);
    setMode(null);
  }, [form, editingLocalId, switchConfigs, onUpdateSwitch]);

  const handleCancel = useCallback(() => {
    setForm(DEFAULT_FORM);
    setEditingLocalId(null);
    setMode(null);
  }, []);

  return (
    <Popover open={open} modal={true} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          Com-Switch
          {switchConfigs.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {switchConfigs.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="center">
        <div className="flex flex-col max-h-[70vh]">
          <div className="p-4 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Switch Management</h4>
              <Badge variant="outline" className="text-xs">
                {switchConfigs.length} switches
              </Badge>
            </div>
          </div>

          {switchConfigs.length > 0 && (
            <>
              <Separator />
              <ScrollArea className="flex-1 overflow-auto min-h-0">
                <div className="space-y-1.5 p-4">
                  {switchConfigs.map((sw) => (
                    <div
                      key={sw.localId}
                      className={`rounded-lg shadow border p-2 text-sm ${editingLocalId === sw.localId ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium truncate">{sw.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEdit(sw)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => onRemoveSwitch(sw.localId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-x-0.5">
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Ch.{sw.channel}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {sw.type}
                        </Badge>
                        {/* <Badge variant="outline" className="text-xs text-muted-foreground">
                        {SWITCH_INPUT_COUNTS[sw.type] ?? 1}in
                      </Badge> */}
                        {sw.switchId && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            ID: <span className="font-mono">{sw.switchId}</span>
                          </Badge>
                        )}
                        {sw.keyId && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Key ID: <span className="font-mono">{sw.keyId}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          <div className="p-4 pt-3 border-t">
            {mode === "edit" ? (
              <SwitchForm
                title="Edit Switch"
                form={form}
                setForm={setForm}
                onTypeChange={handleTypeChange}
                onConfirm={handleSave}
                onCancel={handleCancel}
                confirmLabel="Save"
                disableConfirm={!form.type}
              />
            ) : mode === "add" ? (
              <SwitchForm
                title="New Switch"
                form={form}
                setForm={setForm}
                onTypeChange={handleTypeChange}
                onConfirm={handleCreate}
                onCancel={handleCancel}
                confirmLabel="Create"
                disableConfirm={!form.type}
              />
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={handleOpenAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Switch
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
