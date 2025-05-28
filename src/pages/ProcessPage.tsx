import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AdvancedSettingsPanel } from '@/components/AdvancedSettingsPanel';
import * as XLSX from 'xlsx';

export default function ProcessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSheet, setSelectedSheet] = useState('');
  const [progress, setProgress] = useState({
    percent: 0,
    remainingTime: '约1分钟'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // 从路由状态获取工作表数据
  const { sheetNames = [], fileName = '' } = location.state || {};
  const sheets = sheetNames;
  
  // 获取workbook数据
  const [workbookData, setWorkbookData] = useState<any>(null);
  
  useEffect(() => {
    const workbookJSON = localStorage.getItem('currentWorkbook');
    if (workbookJSON) {
      const workbook = JSON.parse(workbookJSON);
      setWorkbookData(workbook);
      
      // 加载第一个工作表的数据预览
      if (workbook.SheetNames.length > 0) {
        updatePreviewData(workbook, workbook.SheetNames[0]);
      }
    }
    
    if (sheets.length > 0 && !selectedSheet) {
      setSelectedSheet(sheets[0]);
    }
  }, [sheets, selectedSheet]);

  const updatePreviewData = (workbook: any, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const previewRows = jsonData.length <= 30 ? jsonData : jsonData.slice(0, 20);
    setPreviewData(previewRows);
  };

  useEffect(() => {
    if (workbookData && selectedSheet) {
      updatePreviewData(workbookData, selectedSheet);
    }
  }, [selectedSheet, workbookData]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartProcessing = () => {
    if (!workbookData || !selectedSheet) {
      toast.error('请先选择工作表');
      return;
    }

    // 保存处理状态，包括选定的工作表名称
    localStorage.setItem('processState', JSON.stringify({
      sheetName: selectedSheet
    }));

    setIsProcessing(true);
    setProgress({ percent: 0, remainingTime: '约1分钟'});

    const timer = setInterval(() => {
      setProgress(prev => {
        const worksheet = workbookData.Sheets[selectedSheet];
        const totalCells = Object.keys(worksheet).length;
        const processedCells = Math.min(totalCells, prev.percent * totalCells / 100 + 5);
        const newPercent = Math.min(100, (processedCells / totalCells) * 100);
        
        if (newPercent >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsProcessing(false);
            navigate('/result');
          }, 500);
          return { percent: 100, remainingTime: '即将完成' };
        }
        
        return {
          percent: newPercent,
          remainingTime: `约${Math.round((100 - newPercent) * 0.3)}秒`
        };
      });
    }, 300);

    return () => clearInterval(timer);
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#1890FF] hover:text-blue-700 transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-1"></i>返回
        </button>
        <div className="text-xl font-semibold text-[#1890FF]">Excel数据处理</div>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[#1890FF] hover:text-blue-700 transition-colors"
        >
          <i className="fa-solid fa-gear mr-1"></i>高级设置
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-[800px] bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-semibold text-center mb-6">数据处理中</h1>
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择工作表 ({fileName})</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1890FF] focus:border-[#1890FF] transition-all duration-200"
              disabled={sheets.length === 0}
            >
              {sheets.length > 0 ? (
                sheets.map(sheet => (
                  <option key={sheet} value={sheet}>{sheet}</option>
                ))
              ) : (
                <option value="">加载中...</option>
              )}
            </select>
          </div>

           {/* 数据预览区域 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">数据预览 ({previewData.length}行)</h3>
            <div className="overflow-auto max-h-60 border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.isArray(row) ? (
                        row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border">
                            {cell}
                          </td>
                        ))
                      ) : (
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border">
                          {JSON.stringify(row)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {progress.percent > 0 ? (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>处理进度</span>
                <span>{progress.percent}% ({progress.remainingTime})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full transition-all duration-300" 
                  style={{
                    width: `${progress.percent}%`,
                    background: 'linear-gradient(90deg, #1890FF 0%, #52C41A 100%)'
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartProcessing}
              disabled={isProcessing || !selectedSheet}
              className={`w-full py-2 rounded-md transition-colors mb-4 ${
                isProcessing || !selectedSheet
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#1890FF] hover:bg-blue-600 text-white'
              }`}
            >
              {isProcessing ? '处理中...' : '开始处理'}
            </button>
          )}

          <div className="text-sm text-gray-600 mb-2">
            <p>正在分析工作表 <span className="font-medium">{selectedSheet}</span> 中的 SERIAL_NUMBER 列...</p>
            <p className="mt-1">已自动检测到分隔符: <span className="font-medium">逗号(,)</span></p>
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
              <i className="fa-solid fa-info-circle mr-1"></i>
              仅处理SERIAL_NUMBER列，其他列数据将完整保留不受影响
            </div>
          </div>
        </div>
      </main>

      <AdvancedSettingsPanel 
        isOpen={showAdvanced} 
        onClose={() => setShowAdvanced(false)} 
      />
    </div>
  );
}
