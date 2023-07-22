import {
  SET_USER_EMAIL,
  SET_USER_LOGGED_IN,
  SET_VERIFY_EMAIL_ATTEMPTS,
  SET_FORGET_PASS_EMAIL_ATTEMPTS,
} from "../Types";

export const setUserEmail = (email) => (dispatch) => {
  dispatch({
    type: SET_USER_EMAIL,
    payload: email,
  });
};

export const setUserLoggedIn = (isLoggedIn) => (dispatch) => {
  dispatch({
    type: SET_USER_LOGGED_IN,
    payload: isLoggedIn,
  });
};

export const setVerifyEmailAttempts = (attempts) => (dispatch) => {
  dispatch({
    type: SET_VERIFY_EMAIL_ATTEMPTS,
    payload: attempts,
  });
};

export const setForgetPassEmailAttempts = (attempts) => (dispatch) => {
  dispatch({
    type: SET_FORGET_PASS_EMAIL_ATTEMPTS,
    payload: attempts,
  });
};

