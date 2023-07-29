import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { store, persistor } from "./redux/Store";
import InactivityTimer from "./components/InactivityTimer";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <InactivityTimer />
      <App />
    </PersistGate>
  </Provider>
);
