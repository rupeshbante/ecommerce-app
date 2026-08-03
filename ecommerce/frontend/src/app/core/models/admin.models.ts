export interface DashboardStats {
  totalOrders: number; totalSales: number; totalCustomers: number; totalProducts: number;
  pendingOrders: number; lowStockProducts: number; salesToday: number; salesThisMonth: number;
  revenueByDay: ChartData[]; topProducts: TopProduct[]; recentOrders: AdminOrderSummary[];
}
export interface ChartData { label: string; value: number; }
export interface TopProduct { id: number; name: string; category: string; totalSold: number; revenue: number; }
export interface AdminOrderSummary { id: number; customerName: string; customerEmail: string; totalAmount: number; status: string; orderDate: string; itemCount: number; }
export interface AdminOrderDetail { id: number; customerName: string; customerEmail: string; totalAmount: number; status: string; shippingAddress: string; orderDate: string; items: AdminOrderItem[]; trackingNumber?: string; carrier?: string; }
export interface AdminOrderItem { productId: number; productName: string; quantity: number; unitPrice: number; }
export interface AdminCustomer { id: number; fullName: string; email: string; role: string; createdAt: string; totalOrders: number; totalSpent: number; }
export interface CategoryItem { id: number; name: string; description: string; icon: string; parentId: number | null; parentName: string | null; isActive: boolean; createdAt: string; productCount: number; subCategoryCount: number; }
export interface Coupon { id: number; code: string; discountType: string; discountValue: number; minOrderAmount: number; maxUses: number; usedCount: number; expiryDate: string | null; isActive: boolean; createdAt: string; isExpired: boolean; remainingUses: number; }
export interface SalesReport { totalRevenue: number; totalOrders: number; totalCustomers: number; totalProducts: number; dailyRevenue: ChartData[]; monthlyRevenue: ChartData[]; topProducts: TopProduct[]; categoryRevenue: CategoryRevenue[]; }
export interface CategoryRevenue { category: string; revenue: number; orders: number; }
export interface AdminProduct { id: number; name: string; description: string; price: number; stock: number; category: string; imageUrl: string; isActive: boolean; }
export interface PagedResult<T> { total: number; page: number; pageSize: number; data: T[]; }
