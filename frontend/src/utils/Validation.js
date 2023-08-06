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
};

export function lengthRangeCheck(value, min, max) {
  return value.length >= min && value.length <= max;
}

export function validateUsernameOnSubmit(username, setErrMsg) {
  if (!lengthRangeCheck(username, 3, 15)) {
    return setErrMsg("Username must be between 3 and 15 characters.");
  }
  if (!regex.username.test(username)) {
    return setErrMsg(
      "Invalid username. Only alphabets, numbers, dash, underscores, and periods are allowed."
    );
  }
  return true;
}

export function validateEmailOnSubmit(email, setErrMsg) {
  if (!lengthRangeCheck(email, 3, 100)) {
    return setErrMsg("Email must be between 3 and 100 characters.");
  }
  if (!regex.email.test(email)) return setErrMsg("Invalid email.");
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
    return setErrMsg("Password must be between 8 and 50 characters.");
  }
  if (!regex.passwordCombined.test(password)) {
    return setErrMsg(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  }
  return true;
}
