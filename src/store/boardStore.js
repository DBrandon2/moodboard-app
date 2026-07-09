import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export const STORAGE_KEY = "moodboard_state";

function stripGroupFields(images = []) {
  return images.map((img) => {
    const cleaned = { ...img };
    delete cleaned.groupId;
    return cleaned;
  });
}

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        images: stripGroupFields(parsed.images || []),
        selectedImageIds: parsed.selectedImageIds || [],
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement du localStorage:", error);
  }
  return { images: [], selectedImageIds: [] };
};

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

      saveToStorage(previousState.images, previousState.selectedImageIds);

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

      saveToStorage(nextState.images, nextState.selectedImageIds);

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

  addImage: (newImage) => {
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

  persistBoard: () => {
    set((state) => {
      saveToStorage(state.images, state.selectedImageIds);
      return state;
    });
  },

  updateImagePosition: (imageId, x, y, options = {}) => {
    const { persist = true } = options;
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, x, y } : img,
      );
      if (persist) {
        saveToStorage(newImages, state.selectedImageIds);
      }
      return {
        images: newImages,
        future: persist ? [] : state.future,
      };
    });
  },

  updateMultipleImagePositions: (imageIds, deltaX, deltaY, options = {}) => {
    const { persist = true } = options;
    const idSet = new Set(imageIds);
    set((state) => {
      const newImages = state.images.map((img) =>
        idSet.has(img.id)
          ? { ...img, x: img.x + deltaX, y: img.y + deltaY }
          : img,
      );
      if (persist) {
        saveToStorage(newImages, state.selectedImageIds);
      }
      return {
        images: newImages,
        future: persist ? [] : state.future,
      };
    });
  },

  selectImages: (imageIds) => {
    set((state) => {
      saveToStorage(state.images, imageIds);
      return { selectedImageIds: imageIds };
    });
  },

  toggleImageSelection: (imageId) => {
    set((state) => {
      const isSelected = state.selectedImageIds.includes(imageId);
      const selectedImageIds = isSelected
        ? state.selectedImageIds.filter((id) => id !== imageId)
        : [...state.selectedImageIds, imageId];
      saveToStorage(state.images, selectedImageIds);
      return { selectedImageIds };
    });
  },

  clearSelection: () => {
    set((state) => {
      saveToStorage(state.images, []);
      return { selectedImageIds: [] };
    });
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

  updateImagePositionAndDimensions: (
    imageId,
    x,
    y,
    width,
    height,
    options = {},
  ) => {
    const { persist = true } = options;
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, x, y, width, height } : img,
      );
      if (persist) {
        saveToStorage(newImages, state.selectedImageIds);
      }
      return {
        images: newImages,
        future: persist ? [] : state.future,
      };
    });
  },

  updateImageRotation: (imageId, rotation, options = {}) => {
    const { persist = true } = options;
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, rotation } : img,
      );
      if (persist) {
        saveToStorage(newImages, state.selectedImageIds);
      }
      return {
        images: newImages,
        future: persist ? [] : state.future,
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
      const newImages = state.images.map((img) =>
        imageIds.includes(img.id)
          ? {
              ...img,
              width: img.originalWidth || img.width,
              height: img.originalHeight || img.height,
            }
          : img,
      );
      saveToStorage(newImages, state.selectedImageIds);
      return {
        images: newImages,
        future: [],
      };
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

      const images = stripGroupFields(importedData.images || []);
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
