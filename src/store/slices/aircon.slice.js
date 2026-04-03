import { toast } from "sonner";
import log from "electron-log/renderer";

function toCards(items) {
  return items.map((item) => ({
    address: item.address,
    name: item.name,
    description: item.description,
    item,
  }));
}

export const createAirconSlice = (set, get) => ({
  createAirconCard: async (cardData, projectId) => {
    try {
      const newItems = await window.electronAPI.aircon.createCard(projectId, cardData);
      set((s) => ({
        projectItems: { ...s.projectItems, aircon: [...s.projectItems.aircon, ...newItems] },
        airconCards: [...s.airconCards, ...toCards(newItems)],
      }));
      toast.success("Aircon card created successfully");
      return newItems;
    } catch (err) {
      log.error("Failed to create aircon card:", err);
      toast.error(err.message || "Failed to create aircon card");
      throw err;
    }
  },

  deleteAirconCard: async (projectId, address) => {
    try {
      await window.electronAPI.aircon.deleteCard(projectId, address);
      set((s) => ({
        projectItems: {
          ...s.projectItems,
          aircon: s.projectItems.aircon.filter((item) => item.address !== address),
        },
        airconCards: s.airconCards.filter((card) => card.address !== address),
      }));
      toast.success("Aircon card deleted successfully");
    } catch (err) {
      log.error("Failed to delete aircon card:", err);
      toast.error(err.message || "Failed to delete aircon card");
      throw err;
    }
  },

  duplicateAirconCard: async (projectId, address) => {
    try {
      const duplicatedItems = await window.electronAPI.aircon.duplicateCard(projectId, address);
      set((s) => ({
        projectItems: { ...s.projectItems, aircon: [...s.projectItems.aircon, ...duplicatedItems] },
        airconCards: [...s.airconCards, ...toCards(duplicatedItems)],
      }));
      toast.success("Aircon card duplicated successfully");
      return duplicatedItems;
    } catch (err) {
      log.error("Failed to duplicate aircon card:", err);
      toast.error(err.message || "Failed to duplicate aircon card");
      throw err;
    }
  },

  updateAirconCard: async (cardData, originalCard, projectId) => {
    try {
      const originalAddress = originalCard ? originalCard.address : cardData.address;
      const itemsToUpdate = get().projectItems.aircon.filter((item) => item.address === originalAddress);

      log.info("Updating aircon card:", {
        originalAddress,
        newAddress: cardData.address,
        itemsToUpdate: itemsToUpdate.length,
      });

      const updatedItems = await Promise.all(
        itemsToUpdate.map((item) =>
          window.electronAPI.aircon.update(item.id, {
            name: cardData.name,
            address: cardData.address,
            description: cardData.description,
            label: item.label,
          })
        )
      );

      set((s) => ({
        projectItems: {
          ...s.projectItems,
          aircon: s.projectItems.aircon.map((item) => {
            const updated = updatedItems.find((u) => u.id === item.id);
            return updated || item;
          }),
        },
        airconCards: s.airconCards.map((card) =>
          card.address === originalAddress
            ? {
                ...card,
                address: cardData.address,
                name: cardData.name,
                description: cardData.description,
                item: { ...card.item, address: cardData.address, name: cardData.name, description: cardData.description },
              }
            : card
        ),
      }));

      toast.success("Aircon card updated successfully");
      return updatedItems;
    } catch (err) {
      log.error("Failed to update aircon card:", err);
      toast.error(err.message || "Failed to update aircon card");
      throw err;
    }
  },
});
