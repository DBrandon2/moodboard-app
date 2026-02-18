import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export const useBoardStore = create((set) => ({
  images: [],
  selectedImageIds: [],

  addimage: (newImage) => {
    set((state) => ({
      images: [
        ...state.images,
        {
          id: uuidv4(),
          ...newImage,
        },
      ],
    }));
  },

  updateImagePosition: (imageId, x, y) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === imageId ? { ...img, x, y } : img,
      ),
    }));
  },

  updateMultipleImagePositions: (imageIds, deltaX, deltaY) => {
    set((state) => ({
      images: state.images.map((img) =>
        imageIds.includes(img.id)
          ? { ...img, x: img.x + deltaX, y: img.y + deltaY }
          : img,
      ),
    }));
  },

  selectImages: (imageIds) => {
    set({ selectedImageIds: imageIds });
  },

  toggleImageSelection: (imageId) => {
    set((state) => {
      const isSelected = state.selectedImageIds.includes(imageId);
      return {
        selectedImageIds: isSelected
          ? state.selectedImageIds.filter((id) => id !== imageId)
          : [...state.selectedImageIds, imageId],
      };
    });
  },

  clearSelection: () => {
    set({ selectedImageIds: [] });
  },
}));
