import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ThemeProvider } from "next-themes";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      value={{
        light: "light-theme",
        dark: "dark-theme",
      }}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
