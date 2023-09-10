import { isDevelopmentEnv } from "../utils/Helpers";

export default function Log(...args) {
  if (!isDevelopmentEnv()) console.log(...args);
}
