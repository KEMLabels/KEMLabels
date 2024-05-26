import {
  SET_USER,
  SET_USER_EMAIL,
  SET_USER_USERNAME,
  SET_USER_CREDIT_AMOUNT,
  SET_USER_LOAD_AMOUNT,
  SET_USER_JOINED_DATE,
  SET_USER_LOGGED_IN,
  SET_USER_VERIFIED,
  SET_SENDER_INFO,
  CLEAR_SESSION,
  CLEAR_USER,
} from "../Types";

export const initialState = {
  email: null,
  username: null,
  creditAmount: 0,
  loadAmount: 0,
  joinedDate: null,
  isLoggedIn: false,
  isVerified: false,
  senderInfo: null,
};

export default function UserReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        email: action.payload.email,
        username: action.payload.username,
        creditAmount: action.payload.creditAmount,
        loadAmount: action.payload.loadAmount,
        joinedDate: action.payload.joinedDate,
        isLoggedIn: action.payload.isLoggedIn,
        isVerified: action.payload.isVerified,
      };
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
    case SET_SENDER_INFO:
      return { ...state, senderInfo: action.payload };
    case CLEAR_SESSION:
      return { ...state, isLoggedIn: false, email: null };
    case CLEAR_USER:
      return initialState;
    default:
      return state;
  }
}
