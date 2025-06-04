// 添加 IndexedDB 工具函数
// Open (or create) an IndexedDB database to store Excel workbooks
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('excel_processor_db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('workbooks')) {
        const store = db.createObjectStore('workbooks', { keyPath: 'id' });
        store.createIndex('fileName', 'fileName', { unique: false });
      }
    };
  });
};

//save an Excel workbook to IndexedDB
const saveWorkbookToDB = async (id: string, fileName: string, data: ArrayBuffer): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workbooks', 'readwrite');
    const store = transaction.objectStore('workbooks');
    
    const request = store.put({ 
      id, 
      fileName, 
      data, 
      timestamp: new Date().toISOString() 
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Retrieve an Excel workbook from IndexedDB by its ID
const getWorkbookFromDB = async (id: string): Promise<ArrayBuffer | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workbooks', 'readonly');
    const store = transaction.objectStore('workbooks');
    
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
};

// Delete an Excel workbook from IndexedDB by its ID
const deleteWorkbookFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workbooks', 'readwrite');
    const store = transaction.objectStore('workbooks');
    
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Export the functions for use in other parts of the web page
export {openDB, saveWorkbookToDB, getWorkbookFromDB, deleteWorkbookFromDB};