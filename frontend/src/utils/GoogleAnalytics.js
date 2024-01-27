import ReactGA from "react-ga";

export const logGAEvent = (category, action, label, value = null) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};
