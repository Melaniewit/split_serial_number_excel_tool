import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';


const sampleFile = {
  name: "示例文件.xlsx",
  size: "10KB",
  url: `/files/示例文件.xlsx`
};


export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isValidFile, setIsValidFile] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

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
        toast.error('文件解析失败');
        console.error(error);
      }
    } else {
      toast.error('请上传.xlsx或.xls格式文件');
    }
  }, [navigate]);

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
        <div className="text-xl font-semibold text-[#1890FF]">Execl序列号拆分工具</div>
        <a href="#" className="text-sm text-gray-600 hover:text-[#1890FF] transition-colors">
          <i className="fa-solid fa-circle-question mr-1"></i>帮助
        </a>
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
              <li>必须包含SERIAL_NUMBER列</li>
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