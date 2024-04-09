import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ErrorBoundary } from "react-error-boundary";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { store, persistor } from "./redux/Store";
import InactivityTimer from "./components/InactivityTimer";
import Log from "./components/Log";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <InactivityTimer />
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);

function ErrorFallback({ error, resetErrorBoundary }) {
  Log("Error Boundary Caught Error:", error);
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
