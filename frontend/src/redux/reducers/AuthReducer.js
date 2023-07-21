import { SET_USER_EMAIL, SET_USER_LOGGED_IN } from "../Types";

export const authInitialState = {
  email: null,
  isLoggedIn: false,
};

export default function AuthReducer(state = authInitialState, action) {
  switch (action.type) {
    case SET_USER_EMAIL:
      return { ...state, email: action.payload };
    case SET_USER_LOGGED_IN:
      return { ...state, isLoggedIn: action.payload };
    default:
      return state;
  }
}
