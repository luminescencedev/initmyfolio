import { all, takeLatest, takeLeading } from "redux-saga/effects";
import { onFetchUser, onSync } from "@/store/sagas/user.saga";
import { fetchUserRequested, syncRequested } from "@/store/slices/user.slice";

export default function* rootSaga() {
  yield all([
    takeLatest(fetchUserRequested, onFetchUser),
    // takeLeading: ignore subsequent sync clicks while one is in progress
    takeLeading(syncRequested, onSync),
  ]);
}
