const regex = {
  username: /^[a-zA-Z0-9_.-]+$/,
  email: /^([a-z0-9_.+-]+)@([\da-z.-]+)\.([a-z.]{2,6})$/,
  password: {
    number: /[0-9]/,
    uppercase: /[A-Z]/,
    specialChar: /[!@#$%^&*()\-_=+{}[\]|\\;:'",.<>/?`~]/,
  },
  passwordCombined:
    /^(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+{}[\]|\\;:'",.<>/?`~])(?=.*[A-Z])(?=.*[a-z]).*$/,
  pagination: /^[1-9]\d*$/,
};

export function lengthRangeCheck(value, min, max) {
  return value.length >= min && value.length <= max;
}

export function validateUsernameOnSubmit(username, setErrMsg) {
  if (!lengthRangeCheck(username, 3, 15)) {
    return setErrMsg(
      "Please ensure your username is between 3 and 15 characters."
    );
  }
  if (!regex.username.test(username)) {
    return setErrMsg(
      "Please ensure your username consists of only alphabets, numbers, dashes, underscores, and periods."
    );
  }
  return true;
}

export function validateEmailOnSubmit(email, setErrMsg) {
  if (!lengthRangeCheck(email, 3, 100)) {
    return setErrMsg(
      "Please ensure your email is between 3 and 100 characters."
    );
  }
  if (!regex.email.test(email))
    return setErrMsg(
      "The email you entered doesn't look right. Please try again."
    );
  return true;
}

export function validatePasswordNumber(password) {
  return regex.password.number.test(password);
}

export function validatePasswordUppercase(password) {
  return regex.password.uppercase.test(password);
}

export function validatePasswordSpecialChar(password) {
  return regex.password.specialChar.test(password);
}

export function validatePasswordOnSubmit(password, setErrMsg) {
  if (!lengthRangeCheck(password, 8, 50)) {
    return setErrMsg(
      "Please ensure your password is be between 8 and 50 characters."
    );
  }
  if (!regex.passwordCombined.test(password)) {
    return setErrMsg(
      "Please ensure your password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  }
  return true;
}

export function validateTablePagination(
  value,
  parsedNumValue,
  minPage,
  maxPage
) {
  if (
    !/^[1-9]\d*$/.test(value) ||
    parsedNumValue < minPage ||
    parsedNumValue > maxPage
  ) {
    return false;
  }
  return true;
}
