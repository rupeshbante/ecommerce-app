import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RazorpayOrder } from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly API = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createRazorpayOrder(orderId: number) {
    return this.http.post<RazorpayOrder>(`${this.API}/create-order`, { orderId });
  }

  verifyPayment(data: { internalOrderId: number; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; }) {
    return this.http.post(`${this.API}/verify`, data);
  }

  openRazorpayCheckout(rzpOrder: RazorpayOrder, userEmail: string, userName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        key: rzpOrder.keyId,
        amount: rzpOrder.amountInPaise,
        currency: rzpOrder.currency,
        name: 'ShopEase',
        description: `Order #${rzpOrder.internalOrderId}`,
        order_id: rzpOrder.razorpayOrderId,
        prefill: { email: userEmail, name: userName },
        theme: { color: '#6c63ff' },
        handler: (response: any) => resolve(response),
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }
}
