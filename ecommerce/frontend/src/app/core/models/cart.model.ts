import { Product } from './product.models';
export interface CartItem { product: Product; quantity: number; }

export interface CartItemServerRow {
  id: number;
  productId: number;
  productName: string;
  price: number;
  category: string;
  imageUrl?: string;
  quantity: number;
  variantId?: number;
  variantLabel?: string;
  stock: number;
}
