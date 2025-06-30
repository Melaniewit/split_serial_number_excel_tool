import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ProcessPage from "@/pages/ProcessPage";
import Home from "@/pages/Home";
import ResultPage from "@/pages/ResultPage";

export default function App() {
  const location = useLocation();
  
  // 添加路由调试信息
  useEffect(() => {
    console.log('=== Route Debug Info ===');
    console.log('Current pathname:', location.pathname);
    console.log('Current search:', location.search);
    console.log('Current hash:', location.hash);
    console.log('Current state:', location.state);
    console.log('========================');
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/result" element={<ResultPage />} />
        {/* Catch-all route for unmatched paths */}
        <Route path="*" element={
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              页面未找到 (404)
            </h1>
            <p className="text-gray-600 mb-4">
              当前路径: {location.pathname}
            </p>
            <button 
              onClick={() => window.location.href = '/split_serial_number_excel_tool/'}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              返回首页
            </button>
          </div>
        } />
      </Routes>
    </div>
  );
}
