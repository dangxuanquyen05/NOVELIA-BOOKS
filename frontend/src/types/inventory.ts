export type TransactionType = 'IMPORT' | 'SALE' | 'CANCEL_RETURN' | 'ADJUSTMENT';

export type StockStatusFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: number;
  bookId: number;
  bookTitle: string;
  isbn?: string;
  coverImage?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  updatedAt: string;
}

export interface InventorySummary {
  totalBooks: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalPhysicalStock: number;
}

export interface InventoryTransactionItem {
  id: number;
  bookId?: number;
  bookTitle?: string;
  isbn?: string;
  coverImage?: string;
  transactionType: TransactionType;
  quantityChange: number;
  remainingQuantity: number;
  note?: string;
  performedBy?: string;
  createdAt: string;
}

export interface InventoryAdjustRequest {
  bookId: number;
  quantityChange: number;
  transactionType: TransactionType;
  note?: string;
}

export interface UpdateThresholdRequest {
  lowStockThreshold: number;
}

export interface GoodsReceiptItem {
  bookId: number;
  quantity: number;
  importPrice?: number;
}

export interface GoodsReceiptRequest {
  receiptCode?: string;
  supplierName?: string;
  note?: string;
  items: GoodsReceiptItem[];
}

export interface GoodsReceiptResponse {
  receiptCode: string;
  supplierName: string;
  totalItems: number;
  totalQuantity: number;
  note?: string;
  performedBy: string;
  createdAt: string;
  updatedInventories: InventoryItem[];
}
