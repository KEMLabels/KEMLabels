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

export const setUser =
  (
    username,
    email,
    creditAmount,
    loadAmount,
    joinedDate,
    isLoggedIn,
    isVerified
  ) =>
  (dispatch) => {
    dispatch({
      type: SET_USER,
      payload: {
        username,
        email,
        creditAmount,
        loadAmount,
        joinedDate,
        isLoggedIn,
        isVerified,
      },
    });
  };

export const setUserEmail = (email) => (dispatch) => {
  dispatch({
    type: SET_USER_EMAIL,
    payload: email,
  });
};

export const setUserName = (username) => (dispatch) => {
  dispatch({
    type: SET_USER_USERNAME,
    payload: username,
  });
};

export const setUserCreditAmount = (creditAmount) => (dispatch) => {
  dispatch({
    type: SET_USER_CREDIT_AMOUNT,
    payload: creditAmount,
  });
};

export const setUserLoadAmount = (loadAmount) => (dispatch) => {
  dispatch({
    type: SET_USER_LOAD_AMOUNT,
    payload: loadAmount,
  });
};

export const setUserJoinedDate = (joiendDate) => (dispatch) => {
  dispatch({
    type: SET_USER_JOINED_DATE,
    payload: joiendDate,
  });
};

export const setUserLoggedIn = (isLoggedIn) => (dispatch) => {
  dispatch({
    type: SET_USER_LOGGED_IN,
    payload: isLoggedIn,
  });
};

export const setUserVerified = (isVerified) => (dispatch) => {
  dispatch({
    type: SET_USER_VERIFIED,
    payload: isVerified,
  });
};

export const setSenderInfo = (setSenderInfo) => (dispatch) => {
  dispatch({
    type: SET_SENDER_INFO,
    payload: setSenderInfo,
  });
};

export const clearSession = () => (dispatch) => {
  dispatch({
    type: CLEAR_SESSION,
  });
};

export const clearUser = () => (dispatch) => {
  dispatch({
    type: CLEAR_USER,
  });
};
