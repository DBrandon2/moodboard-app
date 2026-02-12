import { create } from "zustand";
import { v4 as uuidv4 } from "uuid/v4";

export const useBoardStore = create((set) => ({
  images: [],

  addimage: (url) => {
    set((state) => ({
      images: [
        ...state.images,
        {
          id: uuidv4(),
          url,
          x: 0,
          y: 0,
          width: 200,
          height: 200,
        },
      ],
    }));
  },
}));
