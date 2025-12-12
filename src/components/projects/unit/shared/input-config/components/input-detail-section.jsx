import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, X, Search, Plus } from "lucide-react";
import { GroupItem } from "./group-item";
import { AvailableGroupItem } from "./available-group-item";
import { Separator } from "@/components/ui/separator";

export const InputDetailSection = ({
  selectedGroups,
  availableGroups,
  availableItems,
  lightingItems,
  groupOptions,
  lightingOptions,
  groupTypeLabel,
  usePercentage,
  searchInput,
  searchTerm,
  onTogglePercentage,
  onGroupChange,
  onValueChange,
  onRemoveGroup,
  onAddFromAvailable,
  onAddAllGroups,
  onClearAllGroups,
  onSearchInputChange,
  onSearchKeyPress,
  onCreateNewItem,
  onEditItem,
}) => {
  return (
    <>
      {/* Percentage Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox id="percentage-toggle" checked={usePercentage} onCheckedChange={onTogglePercentage} />
        <Label htmlFor="percentage-toggle" className="text-sm font-medium">
          Show percentage (0-100%) instead of raw values (0-255)
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Selected Groups - Left Side */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Selected Groups ({selectedGroups.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onAddAllGroups} disabled={availableGroups.length === 0} className="flex items-center gap-1">
                <Copy className="h-3 w-3" />
                Add All
              </Button>
              <Button
                variant="outline"
                onClick={onClearAllGroups}
                disabled={selectedGroups.length === 0}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4 -mt-4" />
            {selectedGroups.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {selectedGroups.map((group, index) => {
                    // Find the group item based on current input type
                    const groupItem = availableItems.find((item) => item.id === group.lightingId);

                    // Create stable key combining multiple properties
                    const stableKey = `${group.lightingId || "addr-" + group.groupAddress || "unknown"}-${index}`;

                    return (
                      <GroupItem
                        key={stableKey}
                        group={group}
                        index={index}
                        lightingItem={groupItem}
                        lightingOptions={lightingOptions}
                        groupOptions={groupOptions}
                        groupTypeLabel={groupTypeLabel}
                        usePercentage={usePercentage}
                        onGroupChange={onGroupChange}
                        onValueChange={onValueChange}
                        onRemoveGroup={onRemoveGroup}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground py-8">No groups selected</div>
            )}
          </CardContent>
        </Card>

        {/* Available Groups - Right Side */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">
              Available {groupTypeLabel} ({availableGroups.length})
            </CardTitle>
            {/* Search Input and Create Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or address..."
                  value={searchInput}
                  onChange={onSearchInputChange}
                  onKeyPress={onSearchKeyPress}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={onCreateNewItem}
                disabled={!onCreateNewItem}
                title={`Create new ${groupTypeLabel?.toLowerCase() || "item"}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {searchTerm && <div className="text-xs text-muted-foreground">Searching for: "{searchTerm}"</div>}
          </CardHeader>
          <CardContent>
            <Separator className="mb-4 -mt-4" />
            {availableGroups.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {availableGroups.map((item) => (
                    <AvailableGroupItem key={item.id} item={item} onAddFromAvailable={onAddFromAvailable} onEditItem={onEditItem} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {searchTerm
                  ? `No ${groupTypeLabel.toLowerCase()} groups found matching "${searchTerm}"`
                  : `No available ${groupTypeLabel.toLowerCase()} groups`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
