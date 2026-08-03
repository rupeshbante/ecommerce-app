export interface LoyaltyBalance { points: number; valueInRupees: number; }
export interface LoyaltyTransaction { id: number; points: number; reason: string; orderId?: number; createdAt: string; }
