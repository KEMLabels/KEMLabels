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

export function formatPhoneNumber(value) {
  // Remove all non-numeric characters from the input value
  const cleaned = value.replace(/\D/g, '');

  // Apply formatting based on the cleaned value
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    // Check if all digits are entered, otherwise, return formatted string with only entered digits
    return match[1] ? '(' + match[1] + (match[2] ? ') ' + match[2] + (match[3] ? ' - ' + match[3] : '') : '') : '';
  }

  // If no match is found, return an empty string
  return '';
}

// Check hosting enviorment
export const isDevelopmentEnv = () => process.env.NODE_ENV === "development";
