export interface Address {
  id: number;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city: string;
  isDefault: boolean;
  fullAddressText?: string;
}

export interface AddressRequest {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city: string;
  isDefault?: boolean;
}

export interface CheckoutItem {
  bookId: number;
  bookTitle: string;
  isbn: string;
  coverImageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  availableStock: number;
}

export interface CheckoutSummary {
  items: CheckoutItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  freeShippingThreshold: number;
  savedAddresses: Address[];
}

export interface CreateOrderRequest {
  addressId?: number;
  receiverName?: string;
  phone?: string;
  specificAddress?: string;
  provinceCity?: string;
  district?: string;
  ward?: string;
  paymentMethod: 'COD' | 'VNPAY' | string;
  couponCode?: string;
  note?: string;
  idempotencyKey?: string;
}

export interface OrderItem {
  id: number;
  bookId?: number;
  bookTitle: string;
  coverImageUrl?: string;
  price?: number;
  unitPrice?: number;
  quantity: number;
  totalPrice: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderStatusHistory {
  id: number;
  fromStatus?: string;
  toStatus: string;
  action: string;
  changedBy: string;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId?: number;
  userEmail?: string;
  status: OrderStatus;
  paymentMethod: 'COD' | 'VNPAY' | 'BANK_TRANSFER' | string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED' | string;
  paymentTransactionCode?: string;
  paidAt?: string;
  inventoryRestored?: boolean;
  recipientName?: string;
  receiverName?: string;
  recipientPhone?: string;
  receiverPhone?: string;
  shippingAddress: string;
  shippingAddressSnapshot?: string;
  note?: string;
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  couponCode?: string;
  totalAmount: number;
  items: OrderItem[];
  histories?: OrderStatusHistory[];
  createdAt: string;
  updatedAt?: string;
}
