export interface CartItem {
  id: number;
  bookId: number;
  bookTitle: string;
  bookSlug: string;
  bookCover?: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  totalPrice: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalDistinctItems: number;
  subtotal: number;
}

export interface AddToCartPayload {
  bookId: number;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}
