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
// 预编译所有正则表达式（移动到函数外部）
const TO_RANGE_REGEX = /^S(\d+)\s+to\s+S(\d+)$/i;
const HYPHEN_RANGE_REGEX = /^S(\d+)\s*-\s*S(\d+)$/i;
const INNER_TO_RANGE_REGEX = /^S(\d+)\s+to\s+S(\d+)$/i;
const INNER_HYPHEN_RANGE_REGEX = /^S(\d+)\s*-\s*S(\d+)$/i;

// 分隔符集合（预定义避免重复创建）
const DELIMITERS = [',', '、', '，', ';', '；'];
const OTHER_DELIMITERS_STR = ',、，;；-to';

export const getProcessedData = (): ProcessedResult => {
    const workbookJSON = localStorage.getItem('currentWorkbook');
    const processState = localStorage.getItem('processState');
    
    // 提前处理空值情况
    if (!workbookJSON || !processState) return emptyResult();
    
    const workbook = JSON.parse(workbookJSON);
    const { sheetName } = JSON.parse(processState);
    
    if (!sheetName || !workbook.Sheets[sheetName]) return emptyResult();
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const errorData: ErrorItem[] = [];
    const processedData: any[] = [];
    const totalRows = jsonData.length;
    let processedRows = 0;
    
    // 优化：缓存长度避免重复访问
    const dataLength = jsonData.length;
    
    for (let index = 0; index < dataLength; index++) {
        const row = jsonData[index];
        const rowIndex = index + 2; // Excel行号从2开始
        
        // 优化：一次性获取序列号并检查
        let serialNumber = row['SERIAL_NUMBER'] || row['serial_number'] || row['Serial Number'];
        
        // 处理缺失序列号
        if (!serialNumber) {
            errorData.push({
                row: rowIndex,
                content: JSON.stringify(row),
                reason: "缺少SERIAL_NUMBER列"
            });
            continue;
        }
        
        // 优化：统一转换为字符串处理
        if (typeof serialNumber !== 'string') {
            serialNumber = String(serialNumber);
        }
        
        // 处理范围表达式 (Sxxx to Sxxx / Sxxx-Sxxx)
        const toMatch = TO_RANGE_REGEX.exec(serialNumber);
        const hyphenMatch = HYPHEN_RANGE_REGEX.exec(serialNumber);
        
        if (toMatch || hyphenMatch) {
            const match = toMatch || hyphenMatch;
            const startNum = parseInt(match![1]);
            const endNum = parseInt(match![2]);
            
            if (startNum <= endNum) {
                // 添加原始行
                processedData.push({...row});
                processedRows++;
                
                // 添加范围行
                for (let num = startNum; num <= endNum; num++) {
                    processedData.push({
                        ...row,
                        SERIAL_NUMBER: `S${num}`
                    });
                    processedRows++;
                }
                continue;
            }
        }
        
        // 检查是否只有空格作为分隔符
        let hasOtherDelimiter = false;
        for (let i = 0; i < OTHER_DELIMITERS_STR.length; i++) {
            if (serialNumber.includes(OTHER_DELIMITERS_STR[i])) {
                hasOtherDelimiter = true;
                break;
            }
        }
        
        const hasOnlySpaces = !hasOtherDelimiter && serialNumber.includes(' ');
        
        // 处理分隔符
        let processed = false;
        
        // 优先处理预定义分隔符
        for (const delimiter of DELIMITERS) {
            if (serialNumber.includes(delimiter)) {
                processDelimitedValues(serialNumber, delimiter, row);
                processed = true;
                break;
            }
        }
        
        // 处理空格分隔符
        if (!processed && hasOnlySpaces) {
            processDelimitedValues(serialNumber, ' ', row);
            processed = true;
        }
        
        // 无分隔符的情况
        if (!processed) {
            processedData.push({...row});
            processedRows++;
        }
    }
    
    // 处理分隔符分割的逻辑（提取为内部函数避免重复代码）
    function processDelimitedValues(serialStr: string, delimiter: string, rowData: any) {
        // 添加原始行
        processedData.push({...rowData});
        processedRows++;
        
        const serialNumbers = serialStr.split(delimiter);
        const numbersLength = serialNumbers.length;
        
        for (let i = 0; i < numbersLength; i++) {
            let num = serialNumbers[i].trim();
            if (!num) continue;
            
            // 处理内嵌范围表达式
            const toMatchInner = INNER_TO_RANGE_REGEX.exec(num);
            const hyphenMatchInner = INNER_HYPHEN_RANGE_REGEX.exec(num);
            
            if (toMatchInner || hyphenMatchInner) {
                const match = toMatchInner || hyphenMatchInner;
                const startNum = parseInt(match![1]);
                const endNum = parseInt(match![2]);
                
                if (startNum <= endNum) {
                    for (let n = startNum; n <= endNum; n++) {
                        processedData.push({
                            ...rowData,
                            SERIAL_NUMBER: `S${n}`
                        });
                        processedRows++;
                    }
                    continue;
                }
            }
            
            // 添加普通序列号
            processedData.push({
                ...rowData,
                SERIAL_NUMBER: num
            });
            processedRows++;
        }
    }
    
    return {
        total: totalRows,
        processedRows,
        delimiterStats: [],
        errorData,
        processedData,
        finalRowCount: processedData.length
    };
};

// 空结果辅助函数
function emptyResult(): ProcessedResult {
    return {
        total: 0,
        processedRows: 0,
        delimiterStats: [],
        errorData: [],
        processedData: [],
        finalRowCount: 0
    };
}
// 导出类型定义
export type { ProcessedResult, DelimiterStat, ErrorItem };
