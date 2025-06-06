# Excel序列号拆分工具文档

## 项目概述
这是一个专门用于处理Excel文件中SERIAL_NUMBER列的工具，主要功能包括：
- 识别并拆分SERIAL_NUMBER列中的多个序列号
- 保留其他所有列数据不变
- 提供可视化统计和错误处理
- 支持自定义分隔符规则

## 技术栈
### 核心框架
- **React 18**：前端UI框架
- **TypeScript**：类型安全的JavaScript超集
- **Vite**：构建工具

### 主要库
| 库名称 | 用途 | 版本 |
|--------|------|------|
| react-router-dom | 路由管理 | ^7.3.0 |
| xlsx | Excel文件解析 | ^0.18.5 |
| recharts | 数据可视化 | ^2.15.1 |
| react-beautiful-dnd | 拖拽排序 | ^13.1.1 |
| sonner | 通知提示 | ^2.0.2 |
| tailwind-merge | Tailwind类合并 | ^3.0.2 |

### 样式系统
- **Tailwind CSS**：实用工具优先的CSS框架
- **Font Awesome**：图标库

## 功能模块

### 1. 文件上传模块 (Home.tsx)
```tsx
// 主要功能：
const { getRootProps, getInputProps } = useDropzone({
  onDrop, // 处理文件拖放
  accept: { // 接受的文件类型
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls']
  }
})
```
功能特点：
- 拖放上传界面
- 文件格式验证(.xlsx/.xls)
- 示例文件下载

### 2. 数据处理模块 (ProcessPage.tsx)
核心流程：
1. 选择工作表
2. 数据预览
3. 进度跟踪
4. 高级设置

```tsx
// 进度模拟
const timer = setInterval(() => {
  setProgress(prev => {
    const newPercent = prev.percent + 5;
    if (newPercent >= 100) {
      navigate('/result');
    }
    return { percent: newPercent, remainingTime: ... };
  });
}, 300);
```

### 3. 结果展示模块 (ResultPage.tsx)
主要功能：
- 数据统计展示
- 分隔符使用占比图表
- 处理结果预览
- 异常数据处理
- 结果导出

```tsx
// 数据统计图表
<PieChart>
  <Pie data={delimiterStats} dataKey="value">
    {delimiterStats.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>
```

### 4. 高级设置面板 (AdvancedSettingsPanel.tsx)
功能：
- 自定义分隔符规则
- 规则拖拽排序
- 配置导入/导出

## 核心处理逻辑

### SERIAL_NUMBER列处理规则
1. 列名识别：支持'SERIAL_NUMBER'、'serial_number'等变体
2. 数据类型：必须为字符串类型
3. 分隔符处理：
   - 基础分隔符：逗号、分号、空格
   - 范围表示：S100-S200 或 S100 to S200
4. 错误处理：
   - 缺少SERIAL_NUMBER列
   - 非字符串类型数据

### 其他列数据保留机制
```tsx
// 处理后的数据保留所有原始列
processedData.push({
  ...row, // 保留所有原始数据
  SERIAL_NUMBER: newValue // 只更新SERIAL_NUMBER列
});
```

## 数据流
1. 文件上传 → localStorage保存workbook数据
2. 处理过程 → 更新progress状态
3. 结果展示 → 从localStorage读取处理结果

## 使用指南
1. 上传Excel文件
2. 选择要处理的工作表
3. (可选)调整高级设置
4. 开始处理
5. 查看结果并下载

## 注意事项
1. 仅处理SERIAL_NUMBER列，其他列数据保持不变
2. 文件大小限制为10MB
3. 支持Excel 2007及以上版本

to do list:

home page--process page(preview,decide which sheet to process)--result page(contain process data component)


Problem
1. local storage can't accept files even it is 100 kb+, better storage solution using indexedDB
2. 空格的data，preview 一直错。 fix preview problem & possible use x-spreadsheet 完美地用于 SheetJS 导入后的数据预览和手动编辑场景