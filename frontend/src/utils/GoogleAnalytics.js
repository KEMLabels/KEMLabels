import ReactGA from "react-ga4";

export const logGAEvent = (category, action, label, value = null) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};
