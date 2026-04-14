import { createSlice, createAction, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";
import type { PortfolioUser } from "@/lib/api";

export const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export interface UserState {
  user: PortfolioUser | null;
  token: string | null;
  isLoaded: boolean;
  isSyncing: boolean;
  syncMessage: {
    text: string;
    type: "success" | "error" | "warn";
  } | null;
  lastSyncedAt: number | null;
  syncRateLimitedUntil: number | null;
  previewRefreshAt: number | null;
}

const initialState: UserState = {
  user: null,
  token: null,
  isLoaded: false,
  isSyncing: false,
  syncMessage: null,
  lastSyncedAt: null,
  syncRateLimitedUntil: null,
  previewRefreshAt: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<PortfolioUser>) {
      state.user = action.payload;
      state.isLoaded = true;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    setIsSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    setSyncMessage(state, action: PayloadAction<UserState["syncMessage"]>) {
      state.syncMessage = action.payload;
    },
    setLastSyncedAt(state, action: PayloadAction<number>) {
      state.lastSyncedAt = action.payload;
    },
    setSyncRateLimitedUntil(state, action: PayloadAction<number | null>) {
      state.syncRateLimitedUntil = action.payload;
    },
    setPreviewRefreshAt(state, action: PayloadAction<number>) {
      state.previewRefreshAt = action.payload;
    },
    clearUser() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // On rehydration from sessionStorage, wipe transient UI state
    builder.addCase(REHYDRATE, (state) => {
      state.syncMessage = null;
      state.isSyncing = false;
    });
  },
});

// Async triggers (handled by sagas)
export const fetchUserRequested = createAction<string>(
  "user/fetchUserRequested",
);
export const syncRequested = createAction("user/syncRequested");

export const {
  setUser,
  setToken,
  setIsSyncing,
  setSyncMessage,
  setLastSyncedAt,
  setSyncRateLimitedUntil,
  setPreviewRefreshAt,
  clearUser,
} = userSlice.actions;

export default userSlice.reducer;
