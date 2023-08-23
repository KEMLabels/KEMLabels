export default function Log(...args) {
  if (process.env.NODE_ENV !== "prod") {
    console.log(...args);
  }
}
