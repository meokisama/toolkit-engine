import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MoreHorizontal, Copy, Trash2, Edit, FileText, Upload, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { AirconCardDialog } from "@/components/projects/aircon/aircon-card-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import log from "electron-log/renderer";

// Memoized component to prevent unnecessary rerenders
function AirconCardsComponent({ cards, loading }) {
  const { selectedProject, deleteAirconCard, duplicateAirconCard, exportItems, importItems } = useProjectDetail();
  const dialogs = useTableDialogs();
  const { openCreate, openEdit, closeCrud, openConfirm, closeConfirm, setConfirmLoading, openImport, closeImport } = dialogs;

  const handleCreateCard = useCallback(() => {
    openCreate();
  }, [openCreate]);

  const handleEditCard = useCallback(
    (card) => {
      openEdit(card);
    },
    [openEdit],
  );

  const handleDeleteCard = useCallback(
    (address) => {
      openConfirm({
        title: "Delete Aircon Card",
        description: `Are you sure you want to delete aircon card "${address}"? This action cannot be undone.`,
        onConfirm: async () => {
          if (!selectedProject) return;
          setConfirmLoading(true);
          try {
            await deleteAirconCard(selectedProject.id, address);
            closeConfirm();
          } catch (error) {
            log.error("Failed to delete aircon card:", error);
          } finally {
            setConfirmLoading(false);
          }
        },
      });
    },
    [openConfirm, closeConfirm, setConfirmLoading, selectedProject, deleteAirconCard],
  );

  const handleDuplicateCard = useCallback(
    async (address) => {
      if (!selectedProject) return;
      try {
        await duplicateAirconCard(selectedProject.id, address);
      } catch (error) {
        log.error("Failed to duplicate aircon card:", error);
      }
    },
    [selectedProject, duplicateAirconCard],
  );

  const handleExport = useCallback(async () => {
    try {
      await exportItems("aircon");
    } catch (error) {
      log.error("Failed to export aircon cards:", error);
    }
  }, [exportItems]);

  const handleImport = useCallback(() => openImport(), [openImport]);

  const handleImportConfirm = useCallback(
    async (items) => {
      try {
        await importItems("aircon", items);
        closeImport();
      } catch (error) {
        log.error("Failed to import aircon cards:", error);
      }
    },
    [importItems, closeImport],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed border-2 animate-pulse">
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.address} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">{card.name && card.name.trim() ? card.name : `Aircon ${card.address}`}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Address: {card.address}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditCard(card)} className="cursor-pointer">
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateCard(card.address)} className="cursor-pointer">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteCard(card.address)} variant="destructive" className="cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground p-2">
                  {card.description && <p className="text-sm text-muted-foreground mt-1">{card.description}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="min-h-40 border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center h-full space-y-3">
            <Button onClick={handleCreateCard} variant="default" className="cursor-pointer w-[60%]">
              <Plus className="h-4 w-4" />
              Create Aircon
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-muted-foreground w-[60%] cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Import/Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={handleExport}>
                  <Upload className="h-4 w-4" />
                  Export data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImport}>
                  <Download className="h-4 w-4" />
                  Import data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </div>

      <AirconCardDialog open={dialogs.crud.open && dialogs.crud.mode === "create"} onOpenChange={(open) => !open && closeCrud()} />
      <AirconCardDialog
        open={dialogs.crud.open && dialogs.crud.mode === "edit"}
        onOpenChange={(open) => !open && closeCrud()}
        mode="edit"
        card={dialogs.crud.item}
      />
      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
        onConfirm={dialogs.confirm.onConfirm}
        loading={dialogs.confirm.loading}
        variant="destructive"
      />
      <ImportItemsDialog
        open={dialogs.importDialog.open}
        onOpenChange={(open) => !open && closeImport()}
        category="aircon"
        onImport={handleImportConfirm}
      />
    </div>
  );
}

export const AirconCards = memo(AirconCardsComponent);
