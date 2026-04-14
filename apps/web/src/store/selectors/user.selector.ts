import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import { SYNC_COOLDOWN_MS } from "@/store/slices/user.slice";

export const selectUserState = (state: RootState) => state.user;

export const selectUser = createSelector(selectUserState, (s) => s.user);
export const selectToken = createSelector(selectUserState, (s) => s.token);
export const selectIsLoaded = createSelector(
  selectUserState,
  (s) => s.isLoaded,
);
export const selectIsSyncing = createSelector(
  selectUserState,
  (s) => s.isSyncing,
);
export const selectSyncMessage = createSelector(
  selectUserState,
  (s) => s.syncMessage,
);
export const selectLastSyncedAt = createSelector(
  selectUserState,
  (s) => s.lastSyncedAt,
);
export const selectSyncRateLimitedUntil = createSelector(
  selectUserState,
  (s) => s.syncRateLimitedUntil,
);

export const selectCanSync = createSelector(
  selectIsSyncing,
  selectSyncRateLimitedUntil,
  selectLastSyncedAt,
  (isSyncing, rateLimitedUntil, lastSyncedAt) => {
    if (isSyncing) return false;
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) return false;
    if (lastSyncedAt && Date.now() - lastSyncedAt < SYNC_COOLDOWN_MS)
      return false;
    return true;
  },
);

export const selectSyncCooldownRemaining = createSelector(
  selectLastSyncedAt,
  selectSyncRateLimitedUntil,
  (lastSyncedAt, rateLimitedUntil): number => {
    const fromCooldown = lastSyncedAt
      ? Math.max(0, lastSyncedAt + SYNC_COOLDOWN_MS - Date.now())
      : 0;
    const fromRateLimit = rateLimitedUntil
      ? Math.max(0, rateLimitedUntil - Date.now())
      : 0;
    return Math.max(fromCooldown, fromRateLimit);
  },
);
