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
import storageSession from "redux-persist/lib/storage/session";
import rootReducer from "@/store/root.reducer";
import rootSaga from "@/store/root.saga";

const persistConfig = {
  key: "initmyfolio",
  storage: storageSession,
  whitelist: ["user"], // persist user slice for the session
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
