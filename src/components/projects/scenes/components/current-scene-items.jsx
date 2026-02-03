import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Wind, Blinds, Palette, Sparkles, Edit, Trash2 } from "lucide-react";
import { CONSTANTS } from "@/constants";
import { SceneItemValueControl } from "./scene-item-value-control";
import { CustomBrightnessPopover } from "./custom-brightness-popover";

export function CurrentSceneItems({
  sceneItems,
  groupedSceneItems,
  onAllLightingOn,
  onAllLightingOff,
  customBrightnessDialog,
  setCustomBrightnessDialog,
  onCustomBrightness,
  onEditAirconGroup,
  onRemoveAirconGroup,
  onEditDmxItem,
  onRemoveItem,
  updateSceneItemValue,
  getValueOptions,
  ledEffects,
  onUpdateSpiEffect,
}) {
  const hasLightingItems = sceneItems.some((item) => item.item_type === "lighting");

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          Current Items
          <Badge variant={sceneItems.length >= 60 ? "destructive" : "secondary"}>{sceneItems.length}/60 items</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          {hasLightingItems && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onAllLightingOn} className="text-xs">
                All On
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onAllLightingOff} className="text-xs">
                All Off
              </Button>
              <CustomBrightnessPopover
                open={customBrightnessDialog.open}
                onOpenChange={(open) =>
                  setCustomBrightnessDialog((prev) => ({
                    ...prev,
                    open,
                  }))
                }
                customBrightnessDialog={customBrightnessDialog}
                setCustomBrightnessDialog={setCustomBrightnessDialog}
                onApply={onCustomBrightness}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sceneItems.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {groupedSceneItems.map((item) => {
              // Render aircon group
              if (item.type === "aircon-group") {
                return (
                  <div key={`aircon-group-${item.address}`} className="border rounded-lg p-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium text-sm">{item.name || `Aircon ${item.address}`}</div>
                          <div className="text-xs text-muted-foreground">
                            Address: {item.address} | {item.items.length} properties
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" onClick={() => onEditAirconGroup(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => onRemoveAirconGroup(item.address)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Show individual aircon properties */}
                    <div className="space-y-1 ml-6">
                      {item.items.map((airconItem) => (
                        <div key={airconItem.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {CONSTANTS.AIRCON.find((item) => item.obj_type === airconItem.object_type)?.label || airconItem.object_type}
                          </span>
                          <div className="flex items-center gap-2">
                            <SceneItemValueControl
                              sceneItem={airconItem}
                              updateSceneItemValue={updateSceneItemValue}
                              getValueOptions={getValueOptions}
                            />
                            <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveItem(airconItem.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Render SPI items with effect selection
              if (item.item_type === "spi") {
                const currentEffectIndex = parseInt(item.command || "0");
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Sparkles className="h-4 w-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{item.item_name}</div>
                        <div className="text-xs text-muted-foreground truncate">Address: {item.item_address}</div>
                      </div>
                    </div>
                    <div className="shrink-0 space-y-1">
                      <div className="flex items-center gap-1">
                        <SceneItemValueControl sceneItem={item} updateSceneItemValue={updateSceneItemValue} getValueOptions={getValueOptions} />
                        <Button type="button" variant="outline" size="icon" onClick={() => onRemoveItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {ledEffects && ledEffects.length > 0 && (
                        <Select value={currentEffectIndex.toString()} onValueChange={(value) => onUpdateSpiEffect(item.id, parseInt(value))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select effect" />
                          </SelectTrigger>
                          <SelectContent>
                            {ledEffects.map((effect) => (
                              <SelectItem key={effect.value} value={effect.value.toString()}>
                                {effect.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              }

              // Render regular items (lighting, curtain, dmx)
              return (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.item_type === "lighting" && <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />}
                    {item.item_type === "curtain" && <Blinds className="h-4 w-4 text-green-500 shrink-0" />}
                    {item.item_type === "dmx" && <Palette className="h-4 w-4 text-purple-500 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {item.item_name || `${item.item_type} ${item.item_address}`}
                        {item.item_type === "dmx" && item.label && <span className="text-muted-foreground ml-1">({item.label})</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Address: {item.item_address}
                        {item.item_description && ` | ${item.item_description}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.item_type === "dmx" && (
                      <Button type="button" variant="outline" size="icon" onClick={() => onEditDmxItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {(item.object_type || item.item_type === "lighting") && (
                      <SceneItemValueControl sceneItem={item} updateSceneItemValue={updateSceneItemValue} getValueOptions={getValueOptions} />
                    )}
                    <Button type="button" variant="outline" size="icon" onClick={() => onRemoveItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No items in scene yet</p>
            <p className="text-xs">Add items from the right panel</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
