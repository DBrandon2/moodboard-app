import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export const STORAGE_KEY = "moodboard_state";

/** Position d'ancrage du pack (coin supérieur gauche), figée à la création du groupe */
export function computeGroupAnchorFromImages(images, groupId) {
  const groupImages = images.filter((img) => img.groupId === groupId);
  if (groupImages.length === 0) return null;

  return {
    x: Math.min(...groupImages.map((img) => img.x)),
    y: Math.min(...groupImages.map((img) => img.y)),
  };
}

function getActiveGroupIds(images) {
  const ids = new Set();
  for (const img of images) {
    if (img.groupId) ids.add(img.groupId);
  }
  return ids;
}

function normalizeAnchorsFromRaw(raw = {}) {
  const anchors = {};
  for (const [groupId, value] of Object.entries(raw)) {
    if (
      value &&
      typeof value.x === "number" &&
      typeof value.y === "number"
    ) {
      anchors[groupId] = { x: value.x, y: value.y };
    }
  }
  return anchors;
}

export function migrateGroupAnchors(images, groupAnchors = {}) {
  const anchors = { ...groupAnchors };
  const activeGroupIds = getActiveGroupIds(images);

  for (const groupId of activeGroupIds) {
    if (!anchors[groupId]) {
      const snapshot = computeGroupAnchorFromImages(images, groupId);
      if (snapshot) anchors[groupId] = snapshot;
    }
  }

  for (const groupId of Object.keys(anchors)) {
    if (!activeGroupIds.has(groupId)) {
      delete anchors[groupId];
    }
  }

  return anchors;
}

function pruneGroupAnchors(images, groupAnchors) {
  const anchors = { ...groupAnchors };
  const activeGroupIds = getActiveGroupIds(images);

  for (const groupId of Object.keys(anchors)) {
    if (!activeGroupIds.has(groupId)) {
      delete anchors[groupId];
    }
  }

  return anchors;
}

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const images = parsed.images || [];
      const rawAnchors = parsed.groupAnchors || parsed.groupBounds || {};
      return {
        images,
        selectedImageIds: parsed.selectedImageIds || [],
        groupAnchors: migrateGroupAnchors(
          images,
          normalizeAnchorsFromRaw(rawAnchors),
        ),
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement du localStorage:", error);
  }
  return { images: [], selectedImageIds: [], groupAnchors: {} };
};

const saveToStorage = (images, selectedImageIds, groupAnchors) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        images,
        selectedImageIds,
        groupAnchors,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("Erreur lors de la sauvegarde dans localStorage:", error);
  }
};

const cloneGroupAnchors = (groupAnchors) =>
  JSON.parse(JSON.stringify(groupAnchors || {}));

const initialState = loadFromStorage();

export const useBoardStore = create((set) => ({
  images: initialState.images,
  selectedImageIds: initialState.selectedImageIds,
  groupAnchors: initialState.groupAnchors,
  history: [],
  future: [],

  saveHistory: () => {
    set((state) => ({
      history: [
        ...state.history,
        {
          images: JSON.parse(JSON.stringify(state.images)),
          selectedImageIds: [...state.selectedImageIds],
          groupAnchors: cloneGroupAnchors(state.groupAnchors),
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
      const restoredAnchors = migrateGroupAnchors(
        previousState.images,
        previousState.groupAnchors || {},
      );

      saveToStorage(
        previousState.images,
        previousState.selectedImageIds,
        restoredAnchors,
      );

      return {
        images: previousState.images,
        selectedImageIds: previousState.selectedImageIds,
        groupAnchors: restoredAnchors,
        history: historyClone,
        future: [
          ...state.future,
          {
            images: JSON.parse(JSON.stringify(state.images)),
            selectedImageIds: [...state.selectedImageIds],
            groupAnchors: cloneGroupAnchors(state.groupAnchors),
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
      const restoredAnchors = migrateGroupAnchors(
        nextState.images,
        nextState.groupAnchors || {},
      );

      saveToStorage(
        nextState.images,
        nextState.selectedImageIds,
        restoredAnchors,
      );

      return {
        images: nextState.images,
        selectedImageIds: nextState.selectedImageIds,
        groupAnchors: restoredAnchors,
        history: [
          ...state.history,
          {
            images: JSON.parse(JSON.stringify(state.images)),
            selectedImageIds: [...state.selectedImageIds],
            groupAnchors: cloneGroupAnchors(state.groupAnchors),
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
          groupId: newImage.groupId || undefined,
          ...newImage,
        },
      ];
      saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
      return {
        images: newImages,
        future: [],
      };
    });
  },

  persistBoard: () => {
    set((state) => {
      saveToStorage(state.images, state.selectedImageIds, state.groupAnchors);
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
        saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
        saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
      }
      return {
        images: newImages,
        future: persist ? [] : state.future,
      };
    });
  },

  selectImages: (imageIds) => {
    set((state) => {
      saveToStorage(state.images, imageIds, state.groupAnchors);
      return { selectedImageIds: imageIds };
    });
  },

  toggleImageSelection: (imageId) => {
    set((state) => {
      const isSelected = state.selectedImageIds.includes(imageId);
      const selectedImageIds = isSelected
        ? state.selectedImageIds.filter((id) => id !== imageId)
        : [...state.selectedImageIds, imageId];
      saveToStorage(state.images, selectedImageIds, state.groupAnchors);
      return { selectedImageIds };
    });
  },

  clearSelection: () => {
    set((state) => {
      saveToStorage(state.images, [], state.groupAnchors);
      return { selectedImageIds: [] };
    });
  },

  updateImageDimensions: (imageId, width, height) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === imageId ? { ...img, width, height } : img,
      );
      saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
        saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
        saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
      const newGroupAnchors = pruneGroupAnchors(newImages, state.groupAnchors);
      saveToStorage(newImages, newSelectedIds, newGroupAnchors);
      return {
        images: newImages,
        selectedImageIds: newSelectedIds,
        groupAnchors: newGroupAnchors,
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
            groupId: undefined,
          });
        }
      });

      const allImages = [...state.images, ...newImages];
      const newSelectedIds = newImages.map((img) => img.id);
      saveToStorage(allImages, newSelectedIds, state.groupAnchors);
      return {
        images: allImages,
        selectedImageIds: newSelectedIds,
        future: [],
      };
    });
  },

  groupImages: (draggedImageIds, targetImageId) => {
    set((state) => {
      const targetImage = state.images.find((img) => img.id === targetImageId);
      if (!targetImage) return state;

      const targetGroupId = targetImage.groupId || uuidv4();
      const draggedGroupIds = new Set(
        draggedImageIds
          .map((id) => state.images.find((img) => img.id === id)?.groupId)
          .filter(Boolean),
      );
      if (targetImage.groupId) draggedGroupIds.add(targetImage.groupId);

      const newImages = state.images.map((img) => {
        const shouldGroup =
          draggedImageIds.includes(img.id) ||
          img.id === targetImageId ||
          (img.groupId && draggedGroupIds.has(img.groupId));
        return shouldGroup ? { ...img, groupId: targetGroupId } : img;
      });

      const selectedIds = newImages
        .filter((img) => img.groupId === targetGroupId)
        .map((img) => img.id);

      const newGroupAnchors = { ...state.groupAnchors };

      for (const oldGroupId of draggedGroupIds) {
        if (oldGroupId !== targetGroupId) {
          delete newGroupAnchors[oldGroupId];
        }
      }

      if (!newGroupAnchors[targetGroupId]) {
        const snapshot = computeGroupAnchorFromImages(newImages, targetGroupId);
        if (snapshot) {
          newGroupAnchors[targetGroupId] = snapshot;
        }
      }

      saveToStorage(newImages, selectedIds, newGroupAnchors);
      return {
        images: newImages,
        selectedImageIds: selectedIds,
        groupAnchors: newGroupAnchors,
        future: [],
      };
    });
  },

  updateGroupAnchor: (groupId, x, y, options = {}) => {
    const { persist = true } = options;
    set((state) => {
      if (!state.groupAnchors[groupId]) return state;

      const newGroupAnchors = {
        ...state.groupAnchors,
        [groupId]: { x, y },
      };
      if (persist) {
        saveToStorage(state.images, state.selectedImageIds, newGroupAnchors);
      }
      return { groupAnchors: newGroupAnchors };
    });
  },

  ungroupImages: (groupId) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        img.groupId === groupId ? { ...img, groupId: undefined } : img,
      );
      const newGroupAnchors = { ...state.groupAnchors };
      delete newGroupAnchors[groupId];
      saveToStorage(newImages, state.selectedImageIds, newGroupAnchors);
      return {
        images: newImages,
        groupAnchors: newGroupAnchors,
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
      saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
      saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
      saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
      saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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
      saveToStorage(newImages, state.selectedImageIds, state.groupAnchors);
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

      const images = importedData.images || [];
      const selectedImageIds = importedData.selectedImageIds || [];
      const rawAnchors =
        importedData.groupAnchors || importedData.groupBounds || {};
      const groupAnchors = migrateGroupAnchors(
        images,
        normalizeAnchorsFromRaw(rawAnchors),
      );

      saveToStorage(images, selectedImageIds, groupAnchors);

      return {
        images,
        selectedImageIds,
        groupAnchors,
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
        groupAnchors: {},
        history: [],
        future: [],
      };
    });
  },
}));
