import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import "./index.css";

const basename = "/split_serial_number_excel_tool"; // GitHub Pages仓库名

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>
);   
