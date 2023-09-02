import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ThemeProvider } from "next-themes";

ReactDOM.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>,
  document.getElementById("root")
);
