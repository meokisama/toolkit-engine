import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Lightbulb, Wind, Blinds, Palette, Sparkles } from "lucide-react";

export function AvailableItemsTabs({
  currentTab,
  onTabChange,
  filteredLightingItems,
  filteredAirconCards,
  filteredCurtainItems,
  filteredDmxCards,
  filteredSpiChannels,
  onAddNewItem,
  onEditLightingItem,
  onEditAirconItem,
  onEditCurtainItem,
  onEditDmxItem,
  onAddLightingItem,
  onAddAirconCard,
  onAddCurtainItem,
  onAddDmxCard,
  onAddSpiChannel,
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Available Items</CardTitle>
          {currentTab !== "spi" && (
            <Button type="button" variant="outline" size="sm" onClick={onAddNewItem} className="text-xs">
              <Plus className="h-3 w-3" />
              Add new
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lighting" className="w-full" onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="lighting">
              <Lightbulb className="h-4 w-4" />
              Lighting
            </TabsTrigger>
            <TabsTrigger value="aircon">
              <Wind className="h-4 w-4" />
              Aircon
            </TabsTrigger>
            <TabsTrigger value="curtain">
              <Blinds className="h-4 w-4" />
              Curtain
            </TabsTrigger>
            <TabsTrigger value="dmx">
              <Palette className="h-4 w-4" />
              DMX
            </TabsTrigger>
            <TabsTrigger value="spi">
              <Sparkles className="h-4 w-4" />
              SPI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lighting" className="space-y-2">
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {filteredLightingItems.length > 0 ? (
                filteredLightingItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{item.name || `Group ${item.address}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Address: {item.address}
                        {item.description && ` | ${item.description}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" onClick={() => onEditLightingItem(item)} className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => onAddLightingItem(item.id)} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No lighting items available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="aircon" className="space-y-2">
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {filteredAirconCards.length > 0 ? (
                filteredAirconCards.map((card) => (
                  <div key={card.address} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{card.name || `Aircon ${card.address}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Address: {card.address}
                        {card.description && ` | ${card.description}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" onClick={() => onEditAirconItem(card.item)} className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => onAddAirconCard(card)} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No aircon cards available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="curtain" className="space-y-2">
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {filteredCurtainItems.length > 0 ? (
                filteredCurtainItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Address: {item.address}
                        {item.description && ` | ${item.description}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" onClick={() => onEditCurtainItem(item)} className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => onAddCurtainItem(item.id)} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No curtain items available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dmx" className="space-y-2">
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {filteredDmxCards.length > 0 ? (
                filteredDmxCards.map((card) => (
                  <div key={card.address} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{card.name || `DMX ${card.address}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Address: {card.address}
                        {card.description && ` | ${card.description}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" onClick={() => onEditDmxItem(card.item)} className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => onAddDmxCard(card)} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No DMX cards available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="spi" className="space-y-2">
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {filteredSpiChannels && filteredSpiChannels.length > 0 ? (
                filteredSpiChannels.map((channel) => (
                  <div key={channel.address} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{channel.name}</div>
                      <div className="text-xs text-muted-foreground">Address: {channel.address}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" onClick={() => onAddSpiChannel(channel)} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No SPI channels available</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
