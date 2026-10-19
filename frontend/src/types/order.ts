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
  id?: number;
  bookId: number;
  bookTitle: string;
  bookSlug?: string;
  bookCover?: string;
  coverImageUrl?: string;
  isbn?: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  totalPrice?: number;
  subtotal?: number;
  stockQuantity?: number;
  availableStock?: number;
  isAvailable?: boolean;
}

export interface CheckoutSummary {
  items: CheckoutItem[];
  totalItems?: number;
  subtotal: number;
  shippingFee: number;
  isFreeShipping?: boolean;
  totalAmount: number;
  freeShippingThreshold?: number;
  savedAddresses?: Address[];
  defaultAddress?: Address;
  supportedPaymentMethods?: string[];
}

export interface CreateOrderRequest {
  addressId?: number;
  receiverName?: string;
  receiverPhone?: string;
  phone?: string;
  province?: string;
  provinceCity?: string;
  district?: string;
  ward?: string;
  detailedAddress?: string;
  specificAddress?: string;
  shippingAddress?: string;
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
