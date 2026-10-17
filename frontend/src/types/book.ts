export interface Author {
  id: number;
  name: string;
  slug: string;
  biography?: string;
  avatarUrl?: string;
  nationality?: string;
}

export interface Category {
  id: number;
  parentId?: number | null;
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  children?: Category[];
}

export interface Book {
  id: number;
  title: string;
  slug: string;
  isbn: string;
  coverImage?: string;
  publisher?: string;
  publicationYear?: number;
  pages?: number;
  dimensions?: string;
  coverType?: 'HARDCOVER' | 'PAPERBACK' | string;
  originalPrice: number;
  salePrice: number;
  shortDescription?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  isFeatured?: boolean;
  averageRating: number;
  reviewCount: number;
  stockQuantity: number;
  authors: Author[];
  categories: Category[];
  createdAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface BookFilterParams {
  keyword?: string;
  categoryId?: number;
  categorySlug?: string;
  authorId?: number;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  status?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'title' | string;
  page?: number;
  size?: number;
}
