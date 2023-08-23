import {
  lengthRangeCheck,
  validatePasswordNumber,
  validatePasswordSpecialChar,
  validatePasswordUppercase,
} from "./Validation";

export function getCurrDateTimeInISO() {
  const date = new Date();
  date.toLocaleString("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Vancouver",
  });
  return date.toISOString();
}

export function getCurrDateTime() {
  const formatter = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Vancouver",
  });
  return formatter.format(new Date());
}

// Validate password field during input change
export function validatePasswordOnTyping(password, setPasswordValid) {
  const passwordValid = {
    length: lengthRangeCheck(password, 8, 50),
    uppercase: validatePasswordUppercase(password),
    number: validatePasswordNumber(password),
    specialChar: validatePasswordSpecialChar(password),
  };
  setPasswordValid(passwordValid);
}

// Check hosting enviorment
export const isDevelopmentEnv = () => process.env.NODE_ENV === "dev";
