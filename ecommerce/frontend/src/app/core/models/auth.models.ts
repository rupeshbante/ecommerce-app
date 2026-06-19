export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { fullName: string; email: string; password: string; referralCode?: string; }
export interface AuthResponse { token: string; fullName: string; email: string; role: string; userId: number; }
export interface User { fullName: string; email: string; role: string; userId?: number; }
export interface GoogleLoginRequest { googleId: string; email: string; fullName: string; photoUrl?: string; }
