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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [processedResult, setProcessedResult] = useState<ProcessedResult>({
    total: 0,
    processedRows: 0,
    delimiterStats: [],
    errorData: [],
    processedData: [],
    finalRowCount: 0
  });
  
  const rowsPerPage = 20;

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
  
  // 分页计算
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const currentData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
        <div className="flex space-x-4">
          <button 
            onClick={handleDownload}
            className="flex items-center bg-[#1890FF] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            <i className="fa-solid fa-download mr-2"></i>
            <span className="font-medium">下载结果</span>
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

          {/* 分隔符使用占比图表 */}
          {delimiterStats.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100 transform hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700 flex-grow">分隔符使用占比</h3>
                <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  <i className="fa-solid fa-info-circle mr-2"></i>
                  仅统计SERIAL_NUMBER列
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={delimiterStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {delimiterStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} 行`, '使用次数']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">数据处理规则说明</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <i className="fa-solid fa-circle text-blue-500 text-xs mt-1 mr-2"></i>
                        <span><strong>仅SERIAL_NUMBER列</strong>会被视为序列号列并进行处理</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fa-solid fa-circle text-blue-500 text-xs mt-1 mr-2"></i>
                        <span><strong>其他所有列数据</strong>与序列号无关，会完整保留</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fa-solid fa-circle text-blue-500 text-xs mt-1 mr-2"></i>
                        <span>SERIAL_NUMBER列的值<strong>不会影响或传播</strong>到其他列</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fa-solid fa-circle text-blue-500 text-xs mt-1 mr-2"></i>
                        <span>每条拆分后的记录都包含原始行的<strong>所有非序列号列数据</strong></span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* 分隔符详情表格 */}
                  <div className="mt-4">
                    <h4 className="text-gray-700 font-medium mb-2">分隔符使用详情</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分隔符</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用次数</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">占比</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {delimiterStats.map((stat, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{stat.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{stat.value} 行</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full" 
                                      style={{ width: `${(stat.value / total) * 100}%` }}
                                    ></div>
                                  </div>
                                  {((stat.value / total) * 100).toFixed(1)}%
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 处理后的数据预览 */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100 transform hover:shadow-md transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
                处理后的数据预览 
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (显示前{Math.min(50, processedData.length)}行，共{finalRowCount}行)
                </span>
              </h3>
              <div className="mt-2 md:mt-0">
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <i className="fa-solid fa-download mr-1"></i>
                  导出当前视图
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(processedData[0] || {}).map((key) => (
                      <th 
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value, i) => (
                        <td 
                          key={i}
                          className="px-6 py-4 text-sm text-gray-700"
                        >
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-gray-600">
                  显示 {Math.min((currentPage - 1) * rowsPerPage + 1, processedData.length)} - 
                  {Math.min(currentPage * rowsPerPage, processedData.length)} 条，
                  共 {processedData.length} 条记录
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-chevron-left mr-2"></i>
                    上一页
                  </button>
                  
                  <div className="flex items-center">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return page > 0 && page <= totalPages ? (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 flex items-center justify-center rounded-full mx-1 ${
                            currentPage === page 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ) : null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                    <i className="fa-solid fa-chevron-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">操作</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">查看详情</button>
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
