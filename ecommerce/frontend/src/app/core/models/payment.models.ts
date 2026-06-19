export interface RazorpayOrder {
  razorpayOrderId: string;
  internalOrderId: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
}

export interface Payment {
  id: number;
  orderId: number;
  razorpayPaymentId: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  paidAt?: string;
}

// Razorpay global window declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}
