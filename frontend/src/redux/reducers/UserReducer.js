import {
  SET_USER_EMAIL,
  SET_USER_USERNAME,
  SET_USER_CREDIT_AMOUNT,
  SET_USER_LOAD_AMOUNT,
  SET_USER_JOINED_DATE,
  SET_USER_LOGGED_IN,
  SET_VERIFY_EMAIL_ATTEMPTS,
  SET_FORGET_PASS_EMAIL_ATTEMPTS,
  SET_USER_VERIFIED,
  CLEAR_SESSION,
  CLEAR_USER,
} from "../Types";

export const authInitialState = {
  email: null,
  username: null,
  creditAmount: 0,
  loadAmount: 0,
  joinedDate: null,
  isLoggedIn: false,
  isVerified: false,
  verifyEmail: {
    attempts: 0,
    lastAttemptDateTime: "",
  },
  verifyForgetPassEmail: {
    attempts: 0,
    lastAttemptDateTime: "",
  },
};

export default function UserReducer(state = authInitialState, action) {
  switch (action.type) {
    case SET_USER_EMAIL:
      return { ...state, email: action.payload };
    case SET_USER_USERNAME:
      return { ...state, username: action.payload };
    case SET_USER_CREDIT_AMOUNT:
      return { ...state, creditAmount: action.payload };
    case SET_USER_LOAD_AMOUNT:
      return { ...state, loadAmount: action.payload };
    case SET_USER_JOINED_DATE:
      return { ...state, joinedDate: action.payload };
    case SET_USER_LOGGED_IN:
      return { ...state, isLoggedIn: action.payload };
    case SET_USER_VERIFIED:
      return { ...state, isVerified: action.payload };
    case SET_VERIFY_EMAIL_ATTEMPTS:
      return { ...state, verifyEmail: action.payload };
    case SET_FORGET_PASS_EMAIL_ATTEMPTS:
      return { ...state, verifyForgetPassEmail: action.payload };
    case CLEAR_SESSION:
      return { ...state, isLoggedIn: false, email: null };
    case CLEAR_USER:
      return authInitialState;
    default:
      return state;
  }
}
