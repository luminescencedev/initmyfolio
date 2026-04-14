import { createSlice, createAction, PayloadAction } from "@reduxjs/toolkit";
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
}

const initialState: UserState = {
  user: null,
  token: null,
  isLoaded: false,
  isSyncing: false,
  syncMessage: null,
  lastSyncedAt: null,
  syncRateLimitedUntil: null,
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
    clearUser() {
      return initialState;
    },
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
  clearUser,
} = userSlice.actions;

export default userSlice.reducer;
