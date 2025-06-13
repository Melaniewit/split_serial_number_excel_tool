import * as XLSX from 'xlsx';

export interface DelimiterStat {
  name: string;
  value: number;
}

export interface ErrorItem {
  row: number;
  content: string;
  reason: string;
}

export interface ProcessedResult {
  total: number;
  processedRows: number;
  delimiterStats: DelimiterStat[];
  errorData: ErrorItem[];
  processedData: any[];
  finalRowCount: number;
}
// 预编译正则表达式（在函数外部定义，避免重复编译）
const TO_RANGE_REGEX = /^S(\d+)\s+to\s+S(\d+)$/i;
const HYPHEN_RANGE_REGEX = /^S(\d+)\s*-\s*S(\d+)$/i;

export const getProcessedData = (): ProcessedResult => {
  const workbookJSON = localStorage.getItem('currentWorkbook');
  if (!workbookJSON) return { 
    total: 0, 
    processedRows: 0,
    delimiterStats: [], 
    errorData: [], 
    processedData: [],
    finalRowCount: 0
  };

  const workbook = JSON.parse(workbookJSON);
  const processState = localStorage.getItem('processState');
  if (!processState) return { 
    total: 0, 
    processedRows: 0,
    delimiterStats: [], 
    errorData: [], 
    processedData: [],
    finalRowCount: 0
  };
  
  const { sheetName } = JSON.parse(processState);
  if (!sheetName || !workbook.Sheets[sheetName]) {
    return { 
      total: 0, 
      processedRows: 0,
      delimiterStats: [], 
      errorData: [], 
      processedData: [],
      finalRowCount: 0
    };
  }
  
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  

  const errorData: ErrorItem[] = [];
  const processedData: any[] = [];
  let totalRows = 0;
  let processedRows = 0;

  jsonData.forEach((row: any, index) => {
    totalRows++;
    const serialNumber = row['SERIAL_NUMBER'] || row['serial_number'] || row['Serial Number'];
    
    if (!serialNumber) {
      errorData.push({
        row: index + 2,
        content: JSON.stringify(row),
        reason: "缺少SERIAL_NUMBER列"
      });
      return;
    }

    if (typeof serialNumber !== 'string') {
      errorData.push({
        row: index + 2,
        content: serialNumber.toString(),
        reason: "非文本类型数据"
      });
      return;
    }

  

   // 使用预编译的正则表达式替代内联正则
    const toRangeMatch = TO_RANGE_REGEX.exec(serialNumber);
    if (toRangeMatch) {
      const startNum = parseInt(toRangeMatch[1]);
      const endNum = parseInt(toRangeMatch[2]);
      
      if (startNum <= endNum) {
        processedData.push({...row});
        processedRows++;
        
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

   // 使用预编译的正则表达式替代内联正则
    const hyphenRangeMatch = HYPHEN_RANGE_REGEX.exec(serialNumber);
    if (hyphenRangeMatch) {
      const startNum = parseInt(hyphenRangeMatch[1]);
      const endNum = parseInt(hyphenRangeMatch[2]);
      
      if (startNum <= endNum) {
        processedData.push({...row});
        processedRows++;
        
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
    const splitAndProcess = (delimiter: string) => {
      if (serialNumber.includes(delimiter)) {
        const serialNumbers = serialNumber.split(delimiter);
        processedData.push({...row});
        processedRows++;
        
        serialNumbers.forEach(num => {
          const trimmedNum = num.trim();
          const toRangeMatch = trimmedNum.match(/^S(\d+)\s+to\s+S(\d+)$/i);
          const hyphenRangeMatch = trimmedNum.match(/^S(\d+)\s*-\s*S(\d+)$/i);
          
          if (toRangeMatch) {
            const startNum = parseInt(toRangeMatch[1]);
            const endNum = parseInt(toRangeMatch[2]);
            if (startNum <= endNum) {
             
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
        
        return true;
      }
      return false;
    };

    // 处理各种分隔符
    const processed = 
      splitAndProcess(',') ||  // 英文逗号
      splitAndProcess('、') ||  // 中文顿号
      splitAndProcess('，') ||  // 中文逗号
      (hasOnlySpaces() && splitAndProcess(' ')); // 仅空格作为分隔符

    if (!processed) {
      processedData.push({...row});
      processedRows++;
    }
  });

  const finalRowCount = processedData.length;
  
  return {
    total: totalRows,
    processedRows,
    delimiterStats: [],
    errorData,
    processedData, // 返回完整的处理数据，不再截断
    finalRowCount
  };
};

// 导出类型定义
export type { ProcessedResult, DelimiterStat, ErrorItem };
