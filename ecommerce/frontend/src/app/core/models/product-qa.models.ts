export interface ProductAnswer { id: number; answererName: string; answer: string; createdAt: string; }
export interface ProductQuestion { id: number; productId: number; askerName: string; question: string; createdAt: string; answers: ProductAnswer[]; }
export interface CreateQuestion { productId: number; question: string; }
