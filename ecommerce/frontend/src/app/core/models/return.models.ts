export interface ReturnRequest {
  id: number;
  orderId: number;
  reason: string;
  description: string;
  status: string;
  adminNote: string;
  requestedAt: string;
  processedAt?: string;
}

export interface CreateReturnRequest {
  orderId: number;
  reason: string;
  description: string;
}
