import {
  SET_USER_EMAIL,
  SET_USER_USERNAME,
  SET_USER_CREDIT_AMOUNT,
  SET_USER_JOINED_DATE,
  SET_USER_LOGGED_IN,
  SET_VERIFY_EMAIL_ATTEMPTS,
  SET_FORGET_PASS_EMAIL_ATTEMPTS,
  CLEAR_SESSION,
  CLEAR_USER,
} from "../Types";

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

export const setVerifyEmailAttempts =
  (attempts, lastAttemptDateTime) => (dispatch) => {
    dispatch({
      type: SET_VERIFY_EMAIL_ATTEMPTS,
      payload: { attempts, lastAttemptDateTime },
    });
  };

export const setForgetPassEmailAttempts =
  (attempts, lastAttemptDateTime) => (dispatch) => {
    dispatch({
      type: SET_FORGET_PASS_EMAIL_ATTEMPTS,
      payload: { attempts, lastAttemptDateTime },
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
