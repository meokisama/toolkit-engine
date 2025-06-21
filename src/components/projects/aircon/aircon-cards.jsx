import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { AirconCardDialog } from "@/components/projects/aircon/aircon-card-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { CONSTANTS } from "@/constants";

// Memoized component to prevent unnecessary rerenders
function AirconCardsComponent({ cards, loading }) {
  const {
    selectedProject,
    deleteAirconCard,
    duplicateAirconCard,
    exportItems,
    importItems,
  } = useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [cardToEdit, setCardToEdit] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreateCard = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleEditCard = useCallback((card) => {
    setCardToEdit(card);
    setEditDialogOpen(true);
  }, []);

  const handleDeleteCard = useCallback((address) => {
    setCardToDelete(address);
    setConfirmDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!cardToDelete || !selectedProject) return;

    setDeleteLoading(true);
    try {
      await deleteAirconCard(selectedProject.id, cardToDelete);
      setConfirmDialogOpen(false);
      setCardToDelete(null);
    } catch (error) {
      console.error("Failed to delete aircon card:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [cardToDelete, selectedProject, deleteAirconCard]);

  const handleDuplicateCard = useCallback(
    async (address) => {
      if (!selectedProject) return;

      try {
        await duplicateAirconCard(selectedProject.id, address);
      } catch (error) {
        console.error("Failed to duplicate aircon card:", error);
      }
    },
    [selectedProject, duplicateAirconCard]
  );

  const handleExport = useCallback(async () => {
    try {
      await exportItems("aircon");
    } catch (error) {
      console.error("Failed to export aircon cards:", error);
    }
  }, [exportItems]);

  const handleImport = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportConfirm = useCallback(
    async (items) => {
      try {
        await importItems("aircon", items);
        setImportDialogOpen(false);
      } catch (error) {
        console.error("Failed to import aircon cards:", error);
      }
    },
    [importItems]
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
          {/* Add placeholder card for loading state */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.address} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">
                    {card.name && card.name.trim()
                      ? card.name
                      : `Aircon ${card.address}`}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Address: {card.address}
                  </p>
                  {card.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleEditCard(card)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateCard(card.address)}
                      className="cursor-pointer"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteCard(card.address)}
                      variant="destructive"
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">Air Conditioner</span>
                  <Badge variant="outline" className="text-xs">
                    OBJ_AIRCON
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
                  Supports: Power, Mode, Fan Speed, Temperature, Swing
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add placeholder card for creating new aircon */}
        <Card className="min-h-60 border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center h-full space-y-3">
            <Button
              onClick={handleCreateCard}
              variant="default"
              className="cursor-pointer w-[60%]"
            >
              <Plus className="h-4 w-4" />
              Create Aircon
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-gray-700 w-[60%] cursor-pointer"
                >
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
      <AirconCardDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <AirconCardDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode="edit"
        card={cardToEdit}
      />
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Delete Aircon Card"
        description={`Are you sure you want to delete aircon card "${cardToDelete}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        variant="destructive"
      />
      <ImportItemsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        category="aircon"
        onImport={handleImportConfirm}
      />
    </div>
  );
}

export const AirconCards = memo(AirconCardsComponent);
