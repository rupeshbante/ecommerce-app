export interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  value: string;
  priceModifier: number;
  stock: number;
  sku: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  salePrice?: number;
  saleEndsAt?: string;
}

export interface CreateProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}
