import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UIToastType = "success" | "error";

export interface UIToast {
  id: string;
  type: UIToastType;
  message: string;
}

interface UIToastState {
  toasts: UIToast[];
}

const initialState: UIToastState = { toasts: [] };

const uiToastSlice = createSlice({
  name: "uiToast",
  initialState,
  reducers: {
    addUIToast(state, action: PayloadAction<{ type: UIToastType; message: string }>) {
      state.toasts.push({
        id: `${Date.now()}-${Math.random()}`,
        type: action.payload.type,
        message: action.payload.message,
      });
    },
    removeUIToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { addUIToast, removeUIToast } = uiToastSlice.actions;
export default uiToastSlice.reducer;
