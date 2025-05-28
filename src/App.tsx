import { Routes, Route } from "react-router-dom";
import ProcessPage from "@/pages/ProcessPage";
import Home from "@/pages/Home";
import ResultPage from "@/pages/ResultPage";
import { createContext, useState } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, logout }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </AuthContext.Provider>
  );
}
