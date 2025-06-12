
//useDropzone is a React hook that provides drag-and-drop file upload functionality
import { useDropzone } from 'react-dropzone';
//useNavigate is a hook from react-router-dom that allows navigation programmatically
import { useNavigate } from 'react-router-dom';
// useState is a React hook that allows you to add state to functional components
//useCallback is a React hook that returns a memoized callback function
import { useState, useCallback } from 'react';
//toast is a notification library for React that provides a simple way to display notifications
import { toast } from 'sonner';
//cn is a utility function that combines class names conditionally
import { cn } from '@/lib/utils';
//XLSX is a library for parsing and writing spreadsheet files in JavaScript
import * as XLSX from 'xlsx';


const sampleFile = {
  name: "示例文件.xlsx",
  size: "10KB",
  url: `/files/示例文件.xlsx`
};


export default function Home() {
  // default drag status is false
  const [isDragging, setIsDragging] = useState(false);
  // default file validation status is false
  const [isValidFile, setIsValidFile] = useState(false);
  const navigate = useNavigate();

  //onDrop:a window received a file drop event to contain the file processing logic
  // useCallback is used to memoize the function so that it doesn't get recreated on every render(like a tool box
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
     toast.error('文件过大', {
    description: `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB 超过10MB限制`,
    duration: 8000
      });
      return;
    }

    const isValid = /\.(xlsx|xls)$/i.test(file.name);
    setIsValidFile(isValid);

    if (isValid) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetNames = workbook.SheetNames;
        
        // 保存workbook数据到localStorage
        const workbookJSON = JSON.stringify(workbook);
        localStorage.setItem('currentWorkbook', workbookJSON);
        
        toast.success('文件验证通过');
        navigate('/process', { state: { sheetNames, fileName: file.name } });
      } catch (error) {
        // 创建详细的错误信息
        let errorDetails = "未知错误";
        
        if (error instanceof Error) {
          // 获取错误类型和消息
          errorDetails = `${error.name}: ${error.message}`;
          
          // 添加特定错误的额外信息
          if (error instanceof DOMException) {
            if (error.name === 'AbortError') {
              errorDetails += " (文件读取被中止)";
            } else if (error.name === 'NotReadableError') {
              errorDetails += " (无法读取文件内容)";
            }
          }
        } else if (typeof error === 'string') {
          errorDetails = error;
        } else {
          errorDetails = JSON.stringify(error);
        }
        
        // 显示详细的错误信息
        toast.error('文件解析失败', {
          description: `错误类型: ${errorDetails}`,
          duration: 10000, // 显示10秒
          action: {
            label: '查看详情',
            onClick: () => {
              alert(`文件解析错误详情:\n\n${errorDetails}\n\n完整错误对象已打印在控制台`);
              console.error('完整错误对象:', error);
            }
          }
        });
        
        // 在控制台打印完整错误信息
        console.error('文件解析错误详情:', error);
      }
    } else {
      toast.error('请上传.xlsx或.xls格式文件');
    }
  }, [navigate]);

  // useDropzone hook to handle file drop and drag events
  // getRootProps is a function used to get the props for the dropzone area (onDrop, onDragEnter, onDragLeave)  
  // getInputProps is a function used to get the props for the input element (e.g., file input, accept here)
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="text-xl font-semibold text-[#1890FF]">Excel序列号拆分工具</div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-[600px] bg-white rounded-lg shadow-[0_0_0_2px_#1890FF] p-6 transition-all duration-200">
          <h1 className="text-xl font-semibold text-center mb-6">上传Excel文件</h1>
          
          <div 
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-6 transition-colors",
              isDragging ? "border-solid border-blue-800 bg-blue-100" : "border-blue-300 bg-[#E6F7FF]"
            )}
          >
            <input {...getInputProps()} />
            <i className="fa-solid fa-file-excel text-4xl text-[#1890FF] mb-3"></i>
            <p className="text-gray-700 mb-2">
              {isDragging ? '释放文件以上传' : '拖放文件到此处或点击选择'}
            </p>
            <p className="text-sm text-gray-500">支持 .xlsx 或 .xls 格式</p>
          </div>

          <div className="text-sm text-gray-600 mb-6">
            <h3 className="font-medium mb-2">格式要求：</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>文件大小不超过10MB</li>
               <li>必须包含SERIAL_NUMBER列。如列名不一致，需提前修改。</li>
              <li>仅支持Excel 2007及以上版本</li>
            </ul>
          </div>

          <div className="text-center">
            <a 
              href={sampleFile.url} 
              download={sampleFile.name}
              className="text-[#1890FF] hover:underline inline-flex items-center"
            >
              <i className="fa-solid fa-download mr-2"></i>
              下载示例文件 ({sampleFile.size})
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}