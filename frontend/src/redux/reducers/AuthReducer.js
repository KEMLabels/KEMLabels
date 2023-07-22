import {
  SET_USER_EMAIL,
  SET_USER_LOGGED_IN,
  SET_VERIFY_EMAIL_ATTEMPTS,
  SET_FORGET_PASS_EMAIL_ATTEMPTS,
  CLEAR_USER,
} from "../Types";

export const authInitialState = {
  email: null,
  isLoggedIn: false,
  verifyEmailAttempts: 0,
  verifyForgetPassEmailAttempts: 0,
};

export default function AuthReducer(state = authInitialState, action) {
  switch (action.type) {
    case SET_USER_EMAIL:
      return { ...state, email: action.payload };
    case SET_USER_LOGGED_IN:
      return { ...state, isLoggedIn: action.payload };
    case SET_VERIFY_EMAIL_ATTEMPTS:
      return { ...state, verifyEmailAttempts: action.payload };
    case SET_FORGET_PASS_EMAIL_ATTEMPTS:
      return { ...state, verifyForgetPassEmailAttempts: action.payload };
    case CLEAR_USER:
      return authInitialState;
    default:
      return state;
  }
}
