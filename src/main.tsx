import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import "./index.css";

// 根据环境设置正确的basename
const basename = import.meta.env.DEV ? "/" : "/split_serial_number_excel_tool";

console.log('Current basename:', basename);
console.log('Current environment:', import.meta.env.MODE);
console.log('Current URL:', window.location.href);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>
);   
