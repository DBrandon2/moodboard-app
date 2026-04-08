import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "moodboard_state";

// Charger l'état depuis le localStorage
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        images: parsed.images || [],
        selectedImageIds: parsed.selectedImageIds || [],
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement du localStorage:", error);
  }
  return { images: [], selectedImageIds: [] };
};

// Sauvegarder l'état dans le localStorage
const saveToStorage = (images, selectedImageIds) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        images,
        selectedImageIds,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("Erreur lors de la sauvegarde dans localStorage:", error);
  }
};

const initialState = loadFromStorage();

export const useBoardStore = create((set) => ({
  images: initialState.images,
  selectedImageIds: initialState.selectedImageIds,
  history: [],
  future: [],

  saveHistory: () => {
    set((state) => ({
      history: [
        ...state.history,
        {
          images: JSON.parse(JSON.stringify(state.images)),
          selectedImageIds: [...state.selectedImageIds],
        },
      ],
      future: [],
    }));
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;

      const historyClone = [...state.history];
      const previousState = historyClone.pop();

      return {
        images: previousState.images,
        selectedImageIds: previousState.selectedImageIds,
        history: historyClone,
        future: [
          ...state.future,
          {
            images: JSON.parse(JSON.stringify(state.images)),
            selectedImageIds: [...state.selectedImageIds],
          },
        ],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;

      const futureClone = [...state.future];
      const nextState = futureClone.pop();

      return {
        images: nextState.images,
        selectedImageIds: nextState.selectedImageIds,
        history: [
          ...state.history,
          {
            images: JSON.parse(JSON.stringify(state.images)),
            selectedImageIds: [...state.selectedImageIds],
          },
        ],
        future: futureClone,
      };
    });
  },

  addimage: (newImage) => {
    set((state) => {
      const newImages = [
        ...state.images,
        {
          id: uuidv4(),
          rotation: 0,
          ...newImage,
        },
      ];
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  updateImagePosition: (imageId, x, y) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, x, y } : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  updateMultipleImagePositions: (imageIds, deltaX, deltaY) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        imageIds.includes(img.id)
          ? { ...img, x: img.x + deltaX, y: img.y + deltaY }
          : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
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

  updateImageDimensions: (imageId, width, height) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, width, height } : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  updateImagePositionAndDimensions: (imageId, x, y, width, height) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, x, y, width, height } : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  updateImageRotation: (imageId, rotation) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, rotation } : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  removeImages: (imageIds) => {
    set((state) => {
      const newImages = state.images.filter(
        (img) => !imageIds.includes(img.id),
      );
      const newSelectedIds = state.selectedImageIds.filter(
        (id) => !imageIds.includes(id),
      );
      saveToStorage(newImages, newSelectedIds);
      return {
        images: newImages,
        selectedImageIds: newSelectedIds,
        future: [],
      };
    });
  },

  duplicateImages: (imageIds) => {
    set((state) => {
      const newImages = [];
      imageIds.forEach((id) => {
        const img = state.images.find((i) => i.id === id);
        if (img) {
          newImages.push({
            ...img,
            id: uuidv4(),
            x: img.x + 20,
            y: img.y + 20,
          });
        }
      });

      const allImages = [...state.images, ...newImages];
      const newSelectedIds = newImages.map((img) => img.id);
      saveToStorage(allImages, newSelectedIds);
      return {
        images: allImages,
        selectedImageIds: newSelectedIds,
        future: [],
      };
    });
  },

  bringToFront: (imageIds) => {
    set((state) => {
      const frontImages = state.images.filter((img) =>
        imageIds.includes(img.id),
      );
      const otherImages = state.images.filter(
        (img) => !imageIds.includes(img.id),
      );
      const newImages = [...otherImages, ...frontImages];
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  sendToBack: (imageIds) => {
    set((state) => {
      const backImages = state.images.filter((img) =>
        imageIds.includes(img.id),
      );
      const otherImages = state.images.filter(
        (img) => !imageIds.includes(img.id),
      );
      const newImages = [...backImages, ...otherImages];
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  flipHorizontal: (imageIds) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        imageIds.includes(img.id) ? { ...img, flipH: !img.flipH } : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  flipVertical: (imageIds) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        imageIds.includes(img.id) ? { ...img, flipV: !img.flipV } : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  resetSize: (imageIds) => {
    set((state) => {
      const newState = {
        images: state.images.map((img) =>
          imageIds.includes(img.id)
            ? {
                ...img,
                width: img.originalWidth || img.width,
                height: img.originalHeight || img.height,
              }
            : img,
        ),
        future: [],
      };
      saveToStorage(newState.images, state.selectedImageIds);
      return newState;
    });
  },

  loadFromImport: (importedData) => {
    set(() => {
      const isValid =
        importedData &&
        typeof importedData === "object" &&
        Array.isArray(importedData.images);

      if (!isValid) {
        throw new Error("Format de fichier invalide");
      }

      const images = importedData.images || [];
      const selectedImageIds = importedData.selectedImageIds || [];

      saveToStorage(images, selectedImageIds);

      return {
        images,
        selectedImageIds,
        history: [],
        future: [],
      };
    });
  },

  clearStorage: () => {
    set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return {
        images: [],
        selectedImageIds: [],
        history: [],
        future: [],
      };
    });
  },
}));
