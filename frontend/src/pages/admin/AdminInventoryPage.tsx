import React, { useEffect, useState } from 'react';
import {
  Warehouse,
  AlertTriangle,
  Search,
  PlusCircle,
  RefreshCw,
  History,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  X,
  FileText,
  SlidersHorizontal,
  PackageCheck,
  PackageX,
  Boxes,
  Plus,
  Trash2,
  UserCheck
} from 'lucide-react';
import { adminInventoryService } from '../../services/adminInventoryService';
import type {
  InventoryItem,
  InventorySummary,
  InventoryTransactionItem,
  TransactionType,
  StockStatusFilter
} from '../../types/inventory';
import { Button } from '../../components/ui/Button';
import { AdminLayout } from '../../components/admin/AdminLayout';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const AdminInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Summary state
  const [summary, setSummary] = useState<InventorySummary | null>(null);

  // Inventory state
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [isLoadingInventories, setIsLoadingInventories] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('ALL');
  const [keyword, setKeyword] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [invPage, setInvPage] = useState(0);
  const [invTotalPages, setInvTotalPages] = useState(0);
  const [invTotalElements, setInvTotalElements] = useState(0);

  // History state
  const [transactions, setTransactions] = useState<InventoryTransactionItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedTxType, setSelectedTxType] = useState<string>('ALL');
  const [selectedBookFilterId, setSelectedBookFilterId] = useState<number | undefined>(undefined);
  const [selectedBookFilterTitle, setSelectedBookFilterTitle] = useState<string | undefined>(undefined);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(0);

  // Adjust Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetBook, setTargetBook] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<TransactionType>('ADJUSTMENT');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Threshold Modal state
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [thresholdBook, setThresholdBook] = useState<InventoryItem | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number>(5);
  const [isSubmittingThreshold, setIsSubmittingThreshold] = useState(false);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  // Goods Receipt Modal state (Phiếu nhập hàng)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptCode, setReceiptCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptItems, setReceiptItems] = useState<{ bookId: number; quantity: number }[]>([]);
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; isError?: boolean }>({
    show: false,
    message: '',
  });

  const showToast = (message: string, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventories();
    } else {
      loadTransactions();
    }
  }, [activeTab, statusFilter, keyword, invPage, selectedTxType, selectedBookFilterId, txPage]);

  const loadSummary = async () => {
    try {
      const data = await adminInventoryService.getInventorySummary();
      setSummary(data);
    } catch {
      // ignore
    }
  };

  const loadInventories = async () => {
    setIsLoadingInventories(true);
    try {
      const res = await adminInventoryService.getInventories({
        keyword: keyword || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        lowStockOnly: statusFilter === 'LOW_STOCK',
        page: invPage,
        size: 10,
      });
      setInventories(res.content || []);
      setInvTotalPages(res.totalPages || 0);
      setInvTotalElements(res.totalElements || 0);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể nạp dữ liệu tồn kho', true);
    } finally {
      setIsLoadingInventories(false);
    }
  };

  const loadTransactions = async () => {
    setIsLoadingHistory(true);
    try {
      const typeParam = selectedTxType === 'ALL' ? undefined : (selectedTxType as TransactionType);
      const res = await adminInventoryService.getTransactions({
        bookId: selectedBookFilterId,
        type: typeParam,
        page: txPage,
        size: 15,
      });
      setTransactions(res.content || []);
      setTxTotalPages(res.totalPages || 0);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể nạp lịch sử biến động kho', true);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setInvPage(0);
  };

  const handleOpenAdjustModal = (item: InventoryItem, defaultType: TransactionType = 'ADJUSTMENT') => {
    setTargetBook(item);
    setAdjustType(defaultType);
    setAdjustQuantity(defaultType === 'IMPORT' ? 10 : 0);
    setAdjustNote('');
    setAdjustError(null);
    setAdjustModalOpen(true);
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBook) return;

    if (adjustQuantity === 0) {
      setAdjustError('Số lượng thay đổi phải khác 0.');
      return;
    }

    const projected = targetBook.quantity + adjustQuantity;
    if (projected < 0) {
      setAdjustError(`Tồn kho sau điều chỉnh không thể âm (Hiện tại: ${targetBook.quantity}, Thay đổi: ${adjustQuantity}).`);
      return;
    }

    if (projected < targetBook.reservedQuantity) {
      setAdjustError(`Tồn kho sau điều chỉnh (${projected}) không thể nhỏ hơn số lượng đang giữ cho đơn hàng (${targetBook.reservedQuantity}).`);
      return;
    }

    if (!adjustNote.trim()) {
      setAdjustError('Vui lòng nhập lý do điều chỉnh kho.');
      return;
    }

    setIsSubmittingAdjust(true);
    setAdjustError(null);

    try {
      await adminInventoryService.adjustInventory({
        bookId: targetBook.bookId,
        quantityChange: adjustQuantity,
        transactionType: adjustType,
        note: adjustNote.trim(),
      });

      showToast(`Đã điều chỉnh tồn kho cuốn "${targetBook.bookTitle}" thành công!`);
      setAdjustModalOpen(false);
      setTargetBook(null);
      await loadInventories();
      await loadSummary();
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Không thể cập nhật tồn kho');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleOpenThresholdModal = (item: InventoryItem) => {
    setThresholdBook(item);
    setThresholdValue(item.lowStockThreshold || 5);
    setThresholdError(null);
    setThresholdModalOpen(true);
  };

  const handleConfirmThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdBook) return;

    if (thresholdValue < 0) {
      setThresholdError('Ngưỡng cảnh báo tồn kho tối thiểu là 0.');
      return;
    }

    setIsSubmittingThreshold(true);
    setThresholdError(null);

    try {
      await adminInventoryService.updateThreshold(thresholdBook.bookId, {
        lowStockThreshold: thresholdValue,
      });

      showToast(`Đã cập nhật ngưỡng cảnh báo cho cuốn "${thresholdBook.bookTitle}" thành công!`);
      setThresholdModalOpen(false);
      setThresholdBook(null);
      await loadInventories();
      await loadSummary();
    } catch (err: any) {
      setThresholdError(err.response?.data?.message || 'Không thể cập nhật ngưỡng cảnh báo');
    } finally {
      setIsSubmittingThreshold(false);
    }
  };

  // Goods Receipt Handlers
  const handleOpenReceiptModal = (prefillBook?: InventoryItem) => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    setReceiptCode(`PN-${todayStr}-${randomHex}`);
    setSupplierName('');
    setReceiptNote('');
    setReceiptError(null);

    if (prefillBook) {
      setReceiptItems([{ bookId: prefillBook.bookId, quantity: 10 }]);
    } else if (inventories.length > 0) {
      setReceiptItems([{ bookId: inventories[0].bookId, quantity: 10 }]);
    } else {
      setReceiptItems([]);
    }

    setReceiptModalOpen(true);
  };

  const handleAddReceiptItem = () => {
    if (inventories.length === 0) return;
    setReceiptItems((prev) => [...prev, { bookId: inventories[0].bookId, quantity: 10 }]);
  };

  const handleRemoveReceiptItem = (index: number) => {
    setReceiptItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReceiptItemChange = (index: number, field: 'bookId' | 'quantity', val: number) => {
    setReceiptItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptItems.length === 0) {
      setReceiptError('Vui lòng thêm ít nhất một mặt hàng nhập vào phiếu.');
      return;
    }

    for (const item of receiptItems) {
      if (!item.quantity || item.quantity <= 0) {
        setReceiptError('Số lượng nhập của mỗi cuốn sách phải lớn hơn 0.');
        return;
      }
    }

    setIsSubmittingReceipt(true);
    setReceiptError(null);

    try {
      const res = await adminInventoryService.createGoodsReceipt({
        receiptCode: receiptCode.trim() || undefined,
        supplierName: supplierName.trim() || undefined,
        note: receiptNote.trim() || undefined,
        items: receiptItems,
      });

      showToast(`Tạo phiếu nhập #${res.receiptCode} thành công (${res.totalQuantity} cuốn sách)!`);
      setReceiptModalOpen(false);
      await loadInventories();
      await loadSummary();
      if (activeTab === 'history') await loadTransactions();
    } catch (err: any) {
      setReceiptError(err.response?.data?.message || 'Không thể tạo phiếu nhập hàng');
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  const renderTransactionBadge = (type: TransactionType) => {
    switch (type) {
      case 'SALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <TrendingDown className="w-3 h-3 text-amber-600" /> Xuất Bán
          </span>
        );
      case 'CANCEL_RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <TrendingUp className="w-3 h-3 text-blue-600" /> Hoàn Đơn Hủy
          </span>
        );
      case 'IMPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <PlusCircle className="w-3 h-3 text-emerald-600" /> Nhập Kho
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <RefreshCw className="w-3 h-3 text-purple-600" /> Kiểm Kê Điều Chỉnh
          </span>
        );
      default:
        return <span>{type}</span>;
    }
  };

  return (
    <AdminLayout
      title="Quản Lý Tồn Kho & Xuất Nhập"
      subtitle="Theo dõi số lượng tồn vật lý, hàng đã giữ và khả dụng bán theo thời gian thực"
    >
      <div className="space-y-6">
        {/* Toast */}
        {toast.show && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-sm font-medium border animate-slide-up ${
              toast.isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {toast.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white border border-[#E7E0D5] rounded-3xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-stone-500 text-xs mb-1">
              <Boxes className="w-4 h-4 text-[#1B3B2B]" />
              <span>Tổng Đầu Sách</span>
            </div>
            <p className="text-xl font-serif font-bold text-[#1B3B2B]">
              {summary?.totalBooks ?? invTotalElements}
            </p>
          </div>

          <div className="bg-white border border-emerald-200 rounded-3xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-700 text-xs mb-1">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Đang Sẵn Hàng</span>
            </div>
            <p className="text-xl font-serif font-bold text-emerald-800">
              {summary?.inStockCount ?? 0}
            </p>
          </div>

          <div className="bg-white border border-amber-200 rounded-3xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-amber-700 text-xs mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Sắp Hết Hàng</span>
            </div>
            <p className="text-xl font-serif font-bold text-amber-800">
              {summary?.lowStockCount ?? 0}
            </p>
          </div>

          <div className="bg-white border border-rose-200 rounded-3xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-rose-700 text-xs mb-1">
              <PackageX className="w-4 h-4 text-rose-600" />
              <span>Đã Hết Hàng</span>
            </div>
            <p className="text-xl font-serif font-bold text-rose-800">
              {summary?.outOfStockCount ?? 0}
            </p>
          </div>

          <div className="bg-white border border-[#E7E0D5] rounded-3xl p-4 shadow-xs col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-stone-500 text-xs mb-1">
              <Warehouse className="w-4 h-4 text-[#C5A880]" />
              <span>Tổng Tồn Vật Lý</span>
            </div>
            <p className="text-xl font-serif font-bold text-[#1B3B2B]">
              {summary?.totalPhysicalStock?.toLocaleString('vi-VN') ?? 0} cuốn
            </p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenReceiptModal()}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Lập Phiếu Nhập Hàng
            </Button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadInventories();
              loadSummary();
              if (activeTab === 'history') loadTransactions();
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Làm Mới
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E7E0D5] gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'inventory' ? 'text-[#1B3B2B]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Warehouse className="w-4 h-4" /> Danh Sách Tồn Kho
            </span>
            {activeTab === 'inventory' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3B2B] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'history' ? 'text-[#1B3B2B]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" /> Nhật Ký Biến Động Kho
            </span>
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3B2B] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Inventory Table */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-3xl p-5 border border-[#E7E0D5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm theo tựa sách hoặc ISBN..."
                    className="w-full text-xs rounded-xl border border-[#D5CDC0] pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#1B3B2B] bg-[#FAFAF8]"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">
                  Tìm Kiếm
                </Button>
                {keyword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setKeyword('');
                      setSearchInput('');
                      setInvPage(0);
                    }}
                  >
                    Xóa Lọc
                  </Button>
                )}
              </form>

              {/* Status Filter Badges */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => { setStatusFilter('ALL'); setInvPage(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'ALL'
                      ? 'bg-[#1B3B2B] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('IN_STOCK'); setInvPage(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'IN_STOCK'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Còn hàng
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('LOW_STOCK'); setInvPage(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'LOW_STOCK'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Sắp hết ({summary?.lowStockCount ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('OUT_OF_STOCK'); setInvPage(0); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Hết hàng ({summary?.outOfStockCount ?? 0})
                </button>
              </div>
            </div>

            {/* Inventory List Table */}
            <div className="bg-white rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E7E0D5] text-[#1B3B2B] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Tác Phẩm & ISBN</th>
                      <th className="py-3.5 px-4 text-center">Tổng Tồn</th>
                      <th className="py-3.5 px-4 text-center">Đang Giữ</th>
                      <th className="py-3.5 px-4 text-center">Có Thể Bán</th>
                      <th className="py-3.5 px-4 text-center">Ngưỡng Cảnh Báo</th>
                      <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {isLoadingInventories ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-stone-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B3B2B]" />
                          Đang tải thông tin tồn kho thời gian thực...
                        </td>
                      </tr>
                    ) : inventories.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-stone-500">
                          <Warehouse className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                          Không tìm thấy tác phẩm nào phù hợp với điều kiện lọc.
                        </td>
                      </tr>
                    ) : (
                      inventories.map((item) => {
                        const isOutOfStock = item.availableQuantity <= 0;
                        const isLowStock = !isOutOfStock && item.availableQuantity <= item.lowStockThreshold;

                        return (
                          <tr key={item.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.coverImage || FALLBACK_COVER}
                                  alt={item.bookTitle}
                                  className="w-10 h-14 object-cover rounded-md border border-[#E7E0D5] shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-[#1B3B2B] truncate max-w-xs sm:max-w-sm">
                                    {item.bookTitle}
                                  </p>
                                  <p className="text-[11px] text-stone-400 mt-0.5">
                                    ISBN: <span className="font-mono">{item.isbn || 'Chưa có'}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center font-bold text-stone-800">
                              {item.quantity}
                            </td>

                            <td className="py-3.5 px-4 text-center font-semibold text-stone-500">
                              {item.reservedQuantity > 0 ? (
                                <span className="inline-block px-2 py-0.5 bg-stone-100 rounded-md font-mono text-stone-700">
                                  {item.reservedQuantity}
                                </span>
                              ) : (
                                '0'
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono text-xs ${
                                  isOutOfStock
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {item.availableQuantity}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="font-mono text-stone-600 font-semibold">{item.lowStockThreshold}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenThresholdModal(item)}
                                  className="text-stone-400 hover:text-[#1B3B2B] p-1 rounded transition-colors"
                                  title="Chỉnh sửa ngưỡng cảnh báo"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <PackageX className="w-3 h-3 text-rose-600" /> Hết Hàng
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Sắp Hết
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <PackageCheck className="w-3 h-3 text-emerald-600" /> Đủ Hàng
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleOpenAdjustModal(item, 'IMPORT')}
                                  className="text-[11px] h-7 px-2"
                                  title="Nhập thêm hàng"
                                >
                                  <Plus className="w-3 h-3" /> Nhập Thêm
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenAdjustModal(item, 'ADJUSTMENT')}
                                  className="text-[11px] h-7 px-2"
                                  title="Kiểm kê điều chỉnh"
                                >
                                  Kiểm Kê
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookFilterId(item.bookId);
                                    setSelectedBookFilterTitle(item.bookTitle);
                                    setActiveTab('history');
                                    setTxPage(0);
                                  }}
                                  className="p-1.5 text-stone-400 hover:text-[#1B3B2B] hover:bg-stone-100 rounded-lg transition-colors"
                                  title="Xem lịch sử biến động của sách này"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {invTotalPages > 1 && (
                <div className="p-4 border-t border-[#E7E0D5] flex items-center justify-between text-xs text-stone-500">
                  <span>Trang {invPage + 1} / {invTotalPages} ({invTotalElements} tác phẩm)</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={invPage === 0}
                      onClick={() => setInvPage((p) => Math.max(0, p - 1))}
                    >
                      Trang Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={invPage >= invTotalPages - 1}
                      onClick={() => setInvPage((p) => p + 1)}
                    >
                      Trang Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Transaction History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-[#E7E0D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">Loại biến động:</span>
                <select
                  value={selectedTxType}
                  onChange={(e) => {
                    setSelectedTxType(e.target.value);
                    setTxPage(0);
                  }}
                  className="text-xs rounded-xl border border-[#D5CDC0] px-3 py-2 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                >
                  <option value="ALL">Tất Cả Giao Dịch</option>
                  <option value="SALE">Xuất Bán (SALE)</option>
                  <option value="IMPORT">Nhập Kho (IMPORT)</option>
                  <option value="CANCEL_RETURN">Hoàn Đơn Hủy (CANCEL_RETURN)</option>
                  <option value="ADJUSTMENT">Kiểm Kê Điều Chỉnh (ADJUSTMENT)</option>
                </select>
              </div>

              {selectedBookFilterId && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F5] border border-[#E7E0D5] rounded-xl text-xs text-[#1B3B2B]">
                  <span>Đang lọc theo sách: <strong>{selectedBookFilterTitle}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookFilterId(undefined);
                      setSelectedBookFilterTitle(undefined);
                      setTxPage(0);
                    }}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E7E0D5] text-[#1B3B2B] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Thời Điểm</th>
                      <th className="py-3.5 px-4">Tác Phẩm</th>
                      <th className="py-3.5 px-4 text-center">Loại Biến Động</th>
                      <th className="py-3.5 px-4 text-center">Thay Đổi</th>
                      <th className="py-3.5 px-4 text-center">Tồn Sau Giao Dịch</th>
                      <th className="py-3.5 px-4">Người Thực Hiện</th>
                      <th className="py-3.5 px-4">Ghi Chú / Mã Đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {isLoadingHistory ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-stone-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B3B2B]" />
                          Đang tải lịch sử biến động kho...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-stone-500">
                          Chưa có bản ghi giao dịch biến động kho nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#1B3B2B]">{tx.bookTitle || `Sách #${tx.bookId}`}</span>
                            {tx.isbn && <span className="block text-[11px] text-stone-400 font-mono">ISBN: {tx.isbn}</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {renderTransactionBadge(tx.transactionType)}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold font-mono">
                            <span
                              className={
                                tx.quantityChange > 0
                                  ? 'text-emerald-700'
                                  : tx.quantityChange < 0
                                  ? 'text-rose-700'
                                  : 'text-stone-600'
                              }
                            >
                              {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-stone-700">
                            {tx.remainingQuantity}
                          </td>
                          <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{tx.performedBy || 'Hệ thống'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate" title={tx.note}>
                            {tx.note || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {txTotalPages > 1 && (
                <div className="p-4 border-t border-[#E7E0D5] flex items-center justify-between text-xs text-stone-500">
                  <span>Trang {txPage + 1} / {txTotalPages}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage === 0}
                      onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                    >
                      Trang Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage >= txTotalPages - 1}
                      onClick={() => setTxPage((p) => p + 1)}
                    >
                      Trang Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal 1: Adjust Inventory Modal */}
        {adjustModalOpen && targetBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7E0D5] shadow-2xl relative">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E7E0D5] text-[#1B3B2B] flex items-center justify-center shrink-0">
                  <Warehouse className="w-5 h-5 text-[#1B3B2B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1B3B2B]">
                    Điều Chỉnh Tồn Kho
                  </h3>
                  <p className="text-xs text-stone-500">
                    Ghi nhận thay đổi tồn kho và lưu nhật ký kiểm toán
                  </p>
                </div>
              </div>

              {/* Book Info Summary */}
              <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#E7E0D5] mb-4 text-xs space-y-1.5">
                <p className="font-bold text-[#1B3B2B] truncate">{targetBook.bookTitle}</p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                  <div className="bg-white p-2 rounded-xl border border-[#E7E0D5]">
                    <span className="block text-[10px] text-stone-400 font-sans">Tổng tồn</span>
                    <strong className="text-stone-800">{targetBook.quantity}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E7E0D5]">
                    <span className="block text-[10px] text-stone-400 font-sans">Đang giữ</span>
                    <strong className="text-stone-500">{targetBook.reservedQuantity}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E7E0D5]">
                    <span className="block text-[10px] text-stone-400 font-sans">Có thể bán</span>
                    <strong className="text-emerald-700">{targetBook.availableQuantity}</strong>
                  </div>
                </div>
              </div>

              {adjustError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{adjustError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmAdjust} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Mục đích thao tác
                  </label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as TransactionType)}
                    className="w-full text-xs rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                  >
                    <option value="ADJUSTMENT">Kiểm kê định kỳ / Cân đối sai lệch</option>
                    <option value="IMPORT">Nhập bổ sung trực tiếp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Số lượng thay đổi (dương = tăng tồn, âm = giảm tồn)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-sm font-mono font-bold rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                    />
                    <div className="shrink-0 text-right text-xs">
                      <span className="block text-stone-400 text-[10px]">Tồn dự kiến:</span>
                      <strong
                        className={`font-mono text-sm ${
                          targetBook.quantity + adjustQuantity < 0
                            ? 'text-rose-600'
                            : 'text-[#1B3B2B]'
                        }`}
                      >
                        {targetBook.quantity + adjustQuantity}
                      </strong>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Lý do điều chỉnh <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="VD: Kiểm kê kho cuối tháng phát hiện thừa 2 bản, hoặc rách nát 1 bản..."
                    className="w-full text-xs rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustModalOpen(false)}
                    disabled={isSubmittingAdjust}
                  >
                    Hủy Bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingAdjust || adjustQuantity === 0}
                    leftIcon={isSubmittingAdjust ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
                  >
                    Xác Nhận Lưu
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Low Stock Threshold Modal */}
        {thresholdModalOpen && thresholdBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E7E0D5] shadow-2xl relative">
              <button
                type="button"
                onClick={() => setThresholdModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1B3B2B]">
                    Ngưỡng Cảnh Báo
                  </h3>
                  <p className="text-xs text-stone-500">
                    Cài đặt mức tồn kho tối thiểu
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-700 mb-3 truncate font-bold">
                {thresholdBook.bookTitle}
              </p>

              {thresholdError && (
                <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  {thresholdError}
                </div>
              )}

              <form onSubmit={handleConfirmThreshold} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Ngưỡng số lượng kích hoạt cảnh báo
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-sm font-mono font-bold rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Khi tồn khả dụng $\le$ ngưỡng này, hệ thống sẽ gắn nhãn "Sắp hết hàng".
                  </span>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setThresholdModalOpen(false)}
                    disabled={isSubmittingThreshold}
                  >
                    Đóng
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingThreshold}
                  >
                    Lưu Cài Đặt
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Goods Receipt Voucher Modal (Phiếu Nhập Hàng) */}
        {receiptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#E7E0D5] shadow-2xl relative max-h-[90vh] flex flex-col">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1B3B2B]">
                    Lập Phiếu Nhập Hàng Mới
                  </h3>
                  <p className="text-xs text-stone-500">
                    Nhập bổ sung sách từ nhà xuất bản / nhà phân phối
                  </p>
                </div>
              </div>

              {receiptError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{receiptError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmReceipt} className="space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Mã phiếu nhập
                    </label>
                    <input
                      type="text"
                      value={receiptCode}
                      onChange={(e) => setReceiptCode(e.target.value)}
                      placeholder="VD: PN-20261017-001"
                      className="w-full text-xs font-mono rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nhà cung cấp / Nhà xuất bản
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="VD: NXB Trẻ, Fahasa, Nhã Nam..."
                      className="w-full text-xs rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Ghi chú phiếu nhập
                  </label>
                  <input
                    type="text"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder="VD: Lô hàng nhập bổ sung mùa tựu trường đợt 2"
                    className="w-full text-xs rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
                  />
                </div>

                {/* Items List */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700">
                      Danh sách đầu sách nhập ({receiptItems.length})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddReceiptItem}
                      className="text-xs h-7 px-2.5"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Thêm Sách
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto border border-[#E7E0D5] rounded-2xl p-2.5 bg-[#FAF8F5]">
                    {receiptItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E7E0D5]"
                      >
                        <select
                          value={item.bookId}
                          onChange={(e) =>
                            handleReceiptItemChange(idx, 'bookId', parseInt(e.target.value, 10))
                          }
                          className="flex-1 text-xs rounded-lg border border-stone-200 p-2 bg-[#FAFAF8] truncate focus:outline-none focus:border-[#1B3B2B]"
                        >
                          {inventories.map((inv) => (
                            <option key={inv.bookId} value={inv.bookId}>
                              {inv.bookTitle} (Tồn hiện tại: {inv.quantity})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 w-24">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleReceiptItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full text-xs font-mono font-bold rounded-lg border border-stone-200 p-2 text-center focus:outline-none focus:border-[#1B3B2B]"
                            placeholder="SL"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveReceiptItem(idx)}
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#E7E0D5] shrink-0">
                  <span className="text-xs text-stone-500">
                    Tổng số lượng nhập: <strong className="text-[#1B3B2B]">{receiptItems.reduce((acc, i) => acc + (i.quantity || 0), 0)}</strong> cuốn
                  </span>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReceiptModalOpen(false)}
                      disabled={isSubmittingReceipt}
                    >
                      Hủy Bỏ
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSubmittingReceipt || receiptItems.length === 0}
                      leftIcon={isSubmittingReceipt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
                    >
                      Xác Nhận Nhập Hàng
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
