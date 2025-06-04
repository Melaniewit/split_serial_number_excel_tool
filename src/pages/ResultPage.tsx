import { useState } from 'react';
/*
 * SERIAL_NUMBER列数据处理规则:
 * 1. 列名识别: 检查'SERIAL_NUMBER'、'serial_number'或'Serial Number'等常见变体
 * 2. 数据类型验证: 必须为字符串类型，非字符串类型会被标记为错误
 * 3. 分隔符分析: 统计逗号(,)、分号(;或；)、空格( )的使用情况
 * 4. 错误处理:
 *    - 缺少SERIAL_NUMBER列会被标记为错误
 *    - 非字符串类型会被标记为错误
 * 5. 数据保留: 原始数据会被完整保留，不会修改或删除
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';


const getProcessedData = () => {
  const workbookJSON = localStorage.getItem('currentWorkbook');
  if (!workbookJSON) return { total: 0, delimiterStats: [], errorData: [], processedData: [] };

  const workbook = JSON.parse(workbookJSON);
  const processState = localStorage.getItem('processState');
  if (!processState) return { total: 0, delimiterStats: [], errorData: [], processedData: [] };
  
  const { sheetName } = JSON.parse(processState);
  if (!sheetName || !workbook.Sheets[sheetName]) {
    return { total: 0, delimiterStats: [], errorData: [], processedData: [] };
  }
  
  const worksheet = workbook.Sheets[sheetName];
  
  // 转换工作表数据为JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  const delimiterStats = [
    { name: "逗号", value: 0 },
    { name: "分号", value: 0 },
    { name: "空格", value: 0 },
    { name: "to范围", value: 0 },
    { name: "-范围", value: 0 }
  ];
  const errorData = [];
  const processedData = [];
  let totalRows = 0;
  let processedRows = 0;

  // 分析数据
  jsonData.forEach((row: any, index) => {
    totalRows++;
    const serialNumber = row['SERIAL_NUMBER'] || row['serial_number'] || row['Serial Number'];
    
    if (!serialNumber) {
      errorData.push({
        row: index + 2, // +2因为表头占一行且索引从0开始
        content: JSON.stringify(row),
        reason: "缺少SERIAL_NUMBER列"
      });
      return;
    }

    if (typeof serialNumber !== 'string') {
      errorData.push({
        row: index + 2,
        content: serialNumber,
        reason: "非文本类型数据"
      });
      return;
    }

    // 统计分隔符使用情况
    if (serialNumber.includes(',')) delimiterStats[0].value++;
    if (serialNumber.includes(';') || serialNumber.includes('；')) delimiterStats[1].value++;
    if (serialNumber.includes(' ')) delimiterStats[2].value++;

    // 处理to分隔的序列号范围
    const toRangeMatch = serialNumber.match(/^S(\d+)\s+to\s+S(\d+)$/i);
    if (toRangeMatch) {
      const startNum = parseInt(toRangeMatch[1]);
      const endNum = parseInt(toRangeMatch[2]);
      
      if (startNum <= endNum) {
        delimiterStats[3].value++;
        // 添加原始行
        processedData.push({...row});
        processedRows++;
        
        // 添加拆分后的行
        for (let num = startNum; num <= endNum; num++) {
          processedData.push({
            ...row,
            SERIAL_NUMBER: `S${num}`
          });
          processedRows++;
        }
        return;
      }
    }

    // 处理-分隔的序列号范围
    const hyphenRangeMatch = serialNumber.match(/^S(\d+)\s*-\s*S(\d+)$/i);
    if (hyphenRangeMatch) {
      const startNum = parseInt(hyphenRangeMatch[1]);
      const endNum = parseInt(hyphenRangeMatch[2]);
      
      if (startNum <= endNum) {
        delimiterStats[4].value++;
        // 添加原始行
        processedData.push({...row});
        processedRows++;
        
        // 添加拆分后的行
        for (let num = startNum; num <= endNum; num++) {
          processedData.push({
            ...row,
            SERIAL_NUMBER: `S${num}`
          });
          processedRows++;
        }
        return;
      }
    }

    // 检查是否只有空格作为分隔符
    const hasOnlySpaces = () => {
      const otherDelimiters = [',', '、', '，', ';', '；', '-', 'to'];
      return !otherDelimiters.some(d => serialNumber.includes(d)) && 
             serialNumber.includes(' ');
    };

    // 处理分隔符分隔的SERIAL_NUMBER值
    const splitAndProcess = (delimiter: string, statIndex: number) => {
      if (serialNumber.includes(delimiter)) {
        const serialNumbers = serialNumber.split(delimiter);
        // 添加原始行
        processedData.push({...row});
        processedRows++;
        // 添加拆分后的行
        serialNumbers.forEach(num => {
          const trimmedNum = num.trim();
          // 检查拆分后的部分是否符合to或-格式
          const toRangeMatch = trimmedNum.match(/^S(\d+)\s+to\s+S(\d+)$/i);
          const hyphenRangeMatch = trimmedNum.match(/^S(\d+)\s*-\s*S(\d+)$/i);
          
          if (toRangeMatch) {
            const startNum = parseInt(toRangeMatch[1]);
            const endNum = parseInt(toRangeMatch[2]);
            if (startNum <= endNum) {
              delimiterStats[3].value++; // to范围统计
              // 添加to范围拆分后的行
              for (let n = startNum; n <= endNum; n++) {
                processedData.push({
                  ...row,
                  SERIAL_NUMBER: `S${n}`
                });
                processedRows++;
              }
            }
          } else if (hyphenRangeMatch) {
            const startNum = parseInt(hyphenRangeMatch[1]);
            const endNum = parseInt(hyphenRangeMatch[2]);
            if (startNum <= endNum) {
              delimiterStats[4].value++; // -范围统计
              // 添加-范围拆分后的行
              for (let n = startNum; n <= endNum; n++) {
                processedData.push({
                  ...row,
                  SERIAL_NUMBER: `S${n}`
                });
                processedRows++;
              }
            }
          } else {
            processedData.push({
              ...row,
              SERIAL_NUMBER: trimmedNum
            });
            processedRows++;
          }
        });
        delimiterStats[statIndex].value++;
        return true;
      }
      return false;
    };

    // 处理各种分隔符
    const processed = 
      splitAndProcess(',', 0) ||  // 英文逗号
      splitAndProcess('、', 1) ||  // 中文顿号
      splitAndProcess('，', 2) ||  // 中文逗号
      (hasOnlySpaces() && splitAndProcess(' ', 2)); // 仅空格作为分隔符

    if (!processed) {
      processedData.push({...row});
      processedRows++;
    }
  });

  // 准确计算最终行数（包括所有拆分后的行）
  const finalRowCount = processedData.length;
  
  return {
    total: totalRows,
    processedRows: finalRowCount,
    delimiterStats: delimiterStats.filter(d => d.value > 0),
    errorData,
    processedData: processedData.length <= 50 ? processedData : processedData.slice(0, 50),
    finalRowCount // 添加最终行数统计
  };
};

const { total, processedRows, delimiterStats, errorData, processedData, finalRowCount } = getProcessedData();
const statsData = { total, processedRows, delimiterStats, finalRowCount }; // 包含所有统计

const COLORS = ['#1890FF', '#52C41A', '#FAAD14'];

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
   const { sheetNames = [], fileName = '' } = location.state || {};
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // 分页计算
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const currentData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

 const handleDownload = () => {
  toast.info('正在准备下载处理后的文件...');
  
  // 获取处理后的数据
  const { processedData } = getProcessedData();
  
  if (!processedData || processedData.length === 0) {
    toast.error('没有可下载的处理后数据');
    return;
  }

  try {
    // 创建新的工作簿
    const wb = XLSX.utils.book_new();
    
    // 将处理后的数据转换为工作表
    const ws = XLSX.utils.json_to_sheet(processedData);
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "处理结果");
    
    // 生成 Excel 文件（二进制数据）
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // 创建 Blob
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || '处理结果'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // 清理资源
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('处理后的文件下载完成');
    }, 100);
  } catch (error) {
    toast.error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 同时修改预览部分的说明文本：
<h3 className="text-gray-600 mb-4">
  处理后的数据预览 (显示前{Math.min(50, processedData.length)}行，共{statsData.finalRowCount}行)
</h3>




  const handleReturnHome = () => {
  ['currentWorkbook', 'processState', 'processedData'].forEach(item => {
    localStorage.removeItem(item);
  });
  navigate('/');
};
console.log("File Name:", fileName);

  return (
  
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
    onClick={handleReturnHome} // 直接使用handleReturnHome函数
    className="text-[#1890FF] hover:text-blue-700 transition-colors"
>
    <i className="fa-solid fa-home mr-1"></i>完成
</button>
          
        </div>
        <div className="flex space-x-4">

          <button 
            onClick={handleDownload}
            className="bg-[#1890FF] text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            <i className="fa-solid fa-download mr-1"></i>下载结果
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold mb-6">处理结果摘要 ({fileName})</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              <h3 className="text-gray-600 mb-2">总处理行数</h3>
              <p className="text-3xl font-bold text-[#1890FF]">{statsData.total}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              <h3 className="text-gray-600 mb-2">成功处理行数</h3>
              <p className="text-3xl font-bold text-[#52C41A]">
                {statsData.total - errorData.length}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              <h3 className="text-gray-600 mb-2">异常行数</h3>
              <p className="text-3xl font-bold text-[#FF4D4F]">{errorData.length}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              <h3 className="text-gray-600 mb-2">最终输出行数</h3>
              <p className="text-3xl font-bold text-[#722ED1]">{statsData.finalRowCount}</p>
             </div>
           </div>

           {delimiterStats.length > 0 && (
             <div className="bg-white p-6 rounded-lg shadow-sm mb-8 hover:shadow-md transition-all duration-200">
               <h3 className="text-gray-600 mb-4">分隔符使用占比</h3>
               <p className="text-sm text-gray-500 mb-2">
                 * 统计基于SERIAL_NUMBER列的分隔符使用情况，其他列数据不受影响
               </p>
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
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 处理后的数据预览 */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8 hover:shadow-md transition-all duration-200">
              <h3 className="text-gray-600 mb-4">处理后的数据预览 (显示前50行，共{statsData.finalRowCount}行)</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fa-solid fa-circle-info text-blue-400"></i>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">数据处理规则说明</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>仅SERIAL_NUMBER列</strong>会被视为序列号列并进行处理</li>
                        <li><strong>其他所有列数据</strong>与序列号无关，会完整保留</li>
                        <li>SERIAL_NUMBER列的值<strong>不会影响或传播</strong>到其他列</li>
                        <li>每条拆分后的记录都包含原始行的<strong>所有非序列号列数据</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(processedData[0] || {}).map((key) => (
                      <th 
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
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
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-700">
                  第 {currentPage} 页 / 共 {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </div>

          {errorData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              <h3 className="text-gray-600 mb-4">异常数据处理</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">行号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {errorData.map((item) => (
                      <tr key={item.row} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.row}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.content}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
