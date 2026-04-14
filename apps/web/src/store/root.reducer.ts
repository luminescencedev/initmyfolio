import { combineReducers } from "redux";
import userReducer from "@/store/slices/user.slice";

const rootReducer = combineReducers({
  user: userReducer,
});

export default rootReducer;
