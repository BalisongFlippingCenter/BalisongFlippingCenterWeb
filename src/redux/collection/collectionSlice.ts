import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Collection } from "../../modals/Collection";
import { CollectionKnife } from "../../modals/CollectionKnife";

interface CollectionState {
  collection: Collection | null;
  collectionKnives: Array<CollectionKnife>;
}

const initialState: CollectionState = {
  collection: null,
  collectionKnives: [],
};

const collectionSlice = createSlice({
  name: "collection",
  initialState,
  reducers: {
    clearCollection: (state) => {
      state.collection = null;
      state.collectionKnives = [];
    },
    setCollection: (state, action: PayloadAction<Collection>) => {
      state.collection = action.payload;
      state.collectionKnives = action.payload.collectedKnives!;
    },
    updateCollectionKnife: (state, action: PayloadAction<CollectionKnife>) => {
      const updated = action.payload;
      state.collectionKnives = state.collectionKnives.map((k) =>
        String(k.id) === String(updated.id) ? updated : k
      );
      if (state.collection?.collectedKnives) {
        state.collection.collectedKnives = state.collection.collectedKnives.map((k) =>
          String(k.id) === String(updated.id) ? updated : k
        );
      }
    },
    removeCollectionKnife: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.collectionKnives = state.collectionKnives.filter((k) => String(k.id) !== id);
      if (state.collection?.collectedKnives) {
        state.collection.collectedKnives = state.collection.collectedKnives.filter(
          (k) => String(k.id) !== id
        );
      }
      // Clear featuredKnifeId if the removed knife was featured
      if (state.collection && String(state.collection.featuredKnifeId) === id) {
        state.collection.featuredKnifeId = null;
      }
    },
  },
  extraReducers: (_builder) => {},
});

export const { clearCollection, setCollection, updateCollectionKnife, removeCollectionKnife } = collectionSlice.actions;

export default collectionSlice.reducer;
