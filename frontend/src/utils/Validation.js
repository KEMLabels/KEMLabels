export const regex = {
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
  amountExactMatch: /^[0-9.]$/,
  amount: /^[0-9.]/,
};

export function lengthRangeCheck(value, min, max) {
  return value.length >= min && value.length <= max;
}

export function validateUsernameOnSubmit(username, setFieldErrors) {
  if (!lengthRangeCheck(username, 3, 15)) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      username: "Please ensure your username is between 3 and 15 characters.",
    }));
  }
  if (!regex.username.test(username)) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      username:
        "Please ensure your username consists of only alphabets, numbers, dashes, underscores, and periods.",
    }));
  }
  return true;
}

export function validateEmailOnSubmit(
  email,
  setFieldErrors,
  fieldName = "email"
) {
  if (!lengthRangeCheck(email, 3, 100)) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: "Please ensure your email is between 3 and 100 characters.",
    }));
  }
  if (!regex.email.test(email))
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]:
        "The email you entered doesn't look right. Please try again.",
    }));
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

export function validatePasswordOnSubmit(
  password,
  setFieldErrors,
  fieldName = "password"
) {
  if (!lengthRangeCheck(password, 8, 50)) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]:
        "Please ensure your password is between 8 and 50 characters.",
    }));
  }
  if (!regex.passwordCombined.test(password)) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]:
        "Please ensure your password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }));
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

export function validatePackageWeight(weight, setFieldErrors) {
  if (isNaN(weight) || weight <= 0) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageWeight: "Weight must be a number greater than 0.",
    }));
  } else if (weight > 70) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageWeight: "Weight must be 70 lbs or less.",
    }));
  }
  return true;
}

export function validatePackageLength(length, setFieldErrors) {
  if (isNaN(length) || length <= 0) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageLength: "Length must be a number greater than 0.",
    }));
  } else if (length > 70) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageLength: "Length must be 70 inches less.",
    }));
  }
  return true;
}

export function validatePackageWidth(width, setFieldErrors) {
  if (isNaN(width) || width <= 0) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageWidth: "Width must be a number greater than 0.",
    }));
  } else if (width > 70) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageWidth: "Width must be 70 inches or less.",
    }));
  }
  return true;
}

export function validatePackageHeight(height, setFieldErrors) {
  if (isNaN(height) || height <= 0) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageHeight: "Height must be a number greater than 0.",
    }));
  } else if (height > 70) {
    return setFieldErrors((currentErrors) => ({
      ...currentErrors,
      packageHeight: "Height must be 70 inches or less.",
    }));
  }
  return true;
}
