import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import type { Storage } from "redux-persist";
import rootReducer from "@/store/root.reducer";
import rootSaga from "@/store/root.saga";

// SSR-safe sessionStorage wrapper — redux-persist/lib/storage/session
// accesses sessionStorage at import time which throws on the server.
const sessionStorageSSR: Storage = {
  getItem: (key) => {
    if (typeof window === "undefined") return Promise.resolve(null);
    return Promise.resolve(window.sessionStorage.getItem(key));
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return Promise.resolve();
    window.sessionStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return Promise.resolve();
    window.sessionStorage.removeItem(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: "initmyfolio",
  storage: sessionStorageSSR,
  whitelist: ["user"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);
sagaMiddleware.run(rootSaga);

export type AppStore = typeof store;
export type AppDispatch = AppStore["dispatch"];
export type RootState = ReturnType<typeof rootReducer>;

/** Call on logout to wipe session persistence */
export const purgePersistedStore = () => {
  persistor.purge();
};
