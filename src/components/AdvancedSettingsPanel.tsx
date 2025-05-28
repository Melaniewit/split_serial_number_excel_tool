import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

type DelimiterRule = {
  id: string;
  name: string;
  pattern: string;
};

const defaultRules: DelimiterRule[] = [
  { id: '1', name: '标准逗号', pattern: ',' },
  { id: '2', name: '中文分号', pattern: '；' },
  { id: '3', name: '英文分号', pattern: ';' },
  { id: '4', name: '空格', pattern: ' ' },
  { id: '5', name: '制表符', pattern: '\\t' },
  { id: '6', name: '竖线', pattern: '\\|' }
];

export function AdvancedSettingsPanel({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const [rules, setRules] = useState<DelimiterRule[]>([]);
  const [newRule, setNewRule] = useState<Omit<DelimiterRule, 'id'>>({ name: '', pattern: '' });

  // 从localStorage加载规则
  useEffect(() => {
    const savedRules = localStorage.getItem('delimiterRules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    } else {
      setRules(defaultRules);
    }
  }, []);

  // 保存规则到localStorage
  useEffect(() => {
    if (rules.length > 0) {
      localStorage.setItem('delimiterRules', JSON.stringify(rules));
    }
  }, [rules]);

  const handleAddRule = () => {
    if (!newRule.name || !newRule.pattern) {
      toast.error('请填写规则名称和模式');
      return;
    }

    setRules([...rules, { ...newRule, id: Date.now().toString() }]);
    setNewRule({ name: '', pattern: '' });
    toast.success('规则已添加');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
    toast.success('规则已删除');
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(rules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setRules(items);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedRules = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedRules)) {
          setRules(importedRules);
          toast.success('配置导入成功');
        }
      } catch (error) {
        toast.error('配置文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 重置input
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delimiter-rules-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('配置已导出');
  };

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 border-l-2 border-[#1890FF]",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[#1890FF]">高级设置</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">添加新规则</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">规则名称</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="w-full p-2 border border-[#1890FF] rounded-md focus:ring-[#1890FF] focus:border-[#1890FF]"
                  placeholder="例如: 自定义分隔符"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">分隔符模式</label>
                <input
                  type="text"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                  className="w-full p-2 border border-[#1890FF] rounded-md focus:ring-[#1890FF] focus:border-[#1890FF]"
                  placeholder="例如: ,;|"
                />
                <p className="text-xs text-gray-500 mt-1">支持正则表达式语法</p>
              </div>
              <button
                onClick={handleAddRule}
                className="w-full bg-[#1890FF] text-white py-2 rounded hover:bg-blue-600 transition-colors"
              >
                <i className="fa-solid fa-plus mr-2"></i>添加规则
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">分隔符规则列表</h3>
              <span className="text-xs text-gray-500">{rules.length} 条规则</span>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="rules">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {rules.map((rule, index) => (
                      <Draggable key={rule.id} draggableId={rule.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="p-3 border border-gray-200 rounded-md bg-white flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{rule.name}</div>
                              <div className="text-xs text-gray-500 mt-1">模式: {rule.pattern}</div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <i className="fa-solid fa-grip-vertical"></i>
                              </button>
                              <button 
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-center cursor-pointer transition-colors">
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport}
                className="hidden"
              />
              <i className="fa-solid fa-file-import mr-2"></i>导入配置
            </label>
            <button 
              onClick={handleExport}
              className="bg-[#1890FF] hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              <i className="fa-solid fa-file-export mr-2"></i>导出配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}