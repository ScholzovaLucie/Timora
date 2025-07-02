import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { DataRefreshProvider } from "./contexts/DataRefreshContext";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2C3E50",
    },
    secondary: {
      main: "#1ABC9C",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataRefreshProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </DataRefreshProvider>
  </React.StrictMode>
);
