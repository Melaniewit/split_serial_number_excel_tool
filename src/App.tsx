import { Routes, Route } from "react-router-dom";
import ProcessPage from "@/pages/ProcessPage";
import Home from "@/pages/Home";
import ResultPage from "@/pages/ResultPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/process" element={<ProcessPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  );
}
