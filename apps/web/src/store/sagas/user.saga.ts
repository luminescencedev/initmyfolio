import { call, put, select, delay } from "redux-saga/effects";
import type { SagaIterator } from "redux-saga";
import { getCurrentUser, triggerSync } from "@/lib/api";
import type { PortfolioUser } from "@/lib/api";
import {
  setUser,
  setIsSyncing,
  setSyncMessage,
  setLastSyncedAt,
  setSyncRateLimitedUntil,
  fetchUserRequested,
} from "@/store/slices/user.slice";
import { selectToken, selectUser } from "@/store/selectors/user.selector";

// ── Workers ──

function* fetchUserWorker(token: string): SagaIterator {
  const user: PortfolioUser | null = yield call(getCurrentUser, token);
  if (user) {
    yield put(setUser(user));
  }
}

function* syncWorker(): SagaIterator {
  const token: string | null = yield select(selectToken);
  const user: PortfolioUser | null = yield select(selectUser);
  if (!token || !user) return;

  yield put(setIsSyncing(true));
  yield put(setSyncMessage(null));

  const result: Awaited<ReturnType<typeof triggerSync>> = yield call(
    triggerSync,
    token,
    user.username,
  );

  yield put(setIsSyncing(false));

  if (result.ok) {
    yield put(
      setSyncMessage({
        text: "Sync complete — data updated.",
        type: "success",
      }),
    );
    yield put(setLastSyncedAt(Date.now()));
    yield call(fetchUserWorker, token);
    yield delay(4000);
    yield put(setSyncMessage(null));
  } else if (result.rateLimited && result.availableAt) {
    const until = result.availableAt.getTime();
    yield put(setSyncRateLimitedUntil(until));
    const mins = Math.ceil((result.retryAfter ?? 300) / 60);
    yield put(
      setSyncMessage({
        text: `Rate limited — retry in ${mins}m.`,
        type: "warn",
      }),
    );
    yield delay(8000);
    yield put(setSyncMessage(null));
  } else {
    yield put(
      setSyncMessage({ text: "Sync failed. Please retry.", type: "error" }),
    );
    yield delay(8000);
    yield put(setSyncMessage(null));
  }
}

// ── Orchestrators ──

type FetchAction = ReturnType<typeof fetchUserRequested>;

export function* onFetchUser(action: FetchAction): SagaIterator {
  try {
    yield call(fetchUserWorker, action.payload);
  } catch {
    // silently fail — login redirect handled in component
  }
}

export function* onSync(): SagaIterator {
  try {
    yield call(syncWorker);
  } catch {
    yield put(setIsSyncing(false));
    yield put(
      setSyncMessage({ text: "Sync failed. Please retry.", type: "error" }),
    );
  }
}
