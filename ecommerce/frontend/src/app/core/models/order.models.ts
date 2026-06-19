import { Payment } from './payment.models';
import { ReturnRequest } from './return.models';

export interface CartItemDto { productId: number; quantity: number; variantId?: number; }
export interface CreateOrder { shippingAddress: string; items: CartItemDto[]; couponCode?: string; addressId?: number; }
export interface OrderItemResponse { productId: number; productName: string; quantity: number; unitPrice: number; productImageUrl?: string; }
export interface OrderStatusHistory { status: string; changedAt: string; note?: string; }
export interface Order { id: number; orderDate: string; totalAmount: number; status: string; shippingAddress: string; items: OrderItemResponse[]; payment?: Payment; returnRequest?: ReturnRequest; couponCode?: string; discountAmount?: number; statusHistory?: OrderStatusHistory[]; }
