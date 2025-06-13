import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getProcessedData, ProcessedResult, DelimiterStat, ErrorItem } from './ProcessData';
import * as XLSX from 'xlsx';

const COLORS = ['#1890FF', '#52C41A', '#FAAD14'];

// 定义传递的状态类型
type LocationState = {
  fileName: string;
  selectedSheet: string;
  sheetNames?: string[];
};

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取传递的状态（带默认值防止undefined错误）
  const state = location.state as LocationState;
  const { 
    fileName = '未命名文件', 
    selectedSheet = '未指定工作表', 
    sheetNames = [] 
  } = state || {};
  
  const [processedResult, setProcessedResult] = useState<ProcessedResult>({
    total: 0,
    processedRows: 0,
    delimiterStats: [],
    errorData: [],
    processedData: [],
    finalRowCount: 0
  });
  
  useEffect(() => {
    const result = getProcessedData();
    setProcessedResult(result);
  }, []);

  const { 
    total, 
    processedRows, 
    delimiterStats, 
    errorData, 
    processedData, 
    finalRowCount 
  } = processedResult;
  
  const statsData = { total, processedRows, delimiterStats, finalRowCount };
  
  const handleDownload = () => {
    toast.info('正在准备下载处理后的文件...');
    const result = getProcessedData();
    
    if (!result.processedData || result.processedData.length === 0) {
      toast.error('没有可下载的处理后数据');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.processedData);
      
      // 使用传递的文件名和工作表名称
      XLSX.utils.book_append_sheet(wb, ws, selectedSheet || "处理结果");
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 在文件名中包含工作表名称
      a.download = `${fileName || '处理结果'}_${selectedSheet || '工作表'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('处理后的文件下载完成');
      }, 100);
    } catch (error) {
      toast.error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleReturnHome = () => {
    // 清理本地存储
    ['currentWorkbook', 'processState', 'processedData'].forEach(item => {
      localStorage.removeItem(item);
    });
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleReturnHome}
            className="flex items-center text-[#1890FF] hover:text-blue-700 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            <i className="fa-solid fa-home mr-2"></i>
            <span className="font-medium">完成</span>
          </button>
        </div>
      
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 标题区域 - 显示文件名和工作表名 */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              数据处理结果摘要
            </h1>
            <div className="flex items-center text-gray-600">
              <div className="flex items-center mr-6">
                <i className="fa-solid fa-file-excel text-green-600 mr-2"></i>
                <span className="font-medium">文件:</span>
                <span className="ml-2 bg-blue-50 px-3 py-1 rounded-full">
                  {fileName}
                </span>
              </div>
              <div className="flex items-center">
                <i className="fa-solid fa-layer-group text-purple-600 mr-2"></i>
                <span className="font-medium">工作表:</span>
                <span className="ml-2 bg-purple-50 px-3 py-1 rounded-full">
                  {selectedSheet}
                </span>
              </div>
            </div>
          </div>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <i className="fa-solid fa-list-ol text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-gray-600 mb-1">总处理行数</h3>
                  <p className="text-3xl font-bold text-blue-600">{total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <i className="fa-solid fa-check-circle text-green-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-gray-600 mb-1">成功处理行数</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {total - errorData.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <i className="fa-solid fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-gray-600 mb-1">异常行数</h3>
                  <p className="text-3xl font-bold text-red-600">{errorData.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <i className="fa-solid fa-file-export text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-gray-600 mb-1">最终输出行数</h3>
                  <p className="text-3xl font-bold text-purple-600">{finalRowCount}</p>
                </div>
              </div>
            </div>
          </div>

          

          {/* 下载提示卡片 */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-green-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-file-arrow-down text-green-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">数据处理完成！</h3>

              <button 
                onClick={handleDownload}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors shadow-md"
              >
                <i className="fa-solid fa-download mr-2"></i>
                <span className="font-medium">下载完整数据文件</span>
              </button>
              <p className="mt-4 text-sm text-gray-500">
                <i className="fa-solid fa-lightbulb mr-2 text-yellow-500"></i>
                提示：如日期列数据格式为数字，请在下载后手动选择日期格式。
              </p>
            </div>
          </div>

          {/* 异常数据处理 */}
          {errorData.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 transform hover:shadow-md transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <i className="fa-solid fa-triangle-exclamation text-red-500 mr-2"></i>
                异常数据处理
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (共 {errorData.length} 条异常记录)
                </span>
              </h3>
              
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">行号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">原始内容</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">原因</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {errorData.slice(0, 10).map((item) => (
                      <tr key={item.row} className="hover:bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700">{item.row}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{item.content}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {errorData.length > 10 && (
                <div className="mt-4 text-center">
                  <button className="text-blue-600 hover:text-blue-800 flex items-center justify-center w-full py-2">
                    <i className="fa-solid fa-angles-down mr-2"></i>
                    显示全部 {errorData.length} 条异常记录
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* 底部信息 */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} 数据处理工具 - 版本 2.0.1
            </div>
            <div className="mt-2 md:mt-0">
              <button className="text-sm text-gray-600 hover:text-gray-900 mr-4">
                <i className="fa-solid fa-circle-question mr-1"></i>
                帮助中心
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900">
                <i className="fa-solid fa-envelope mr-1"></i>
                反馈问题
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
