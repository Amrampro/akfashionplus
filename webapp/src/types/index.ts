export type Language = 'fr' | 'en' | 'pt';
export type Role = 'user' | 'cashier' | 'admin';
export interface ApiEnvelope<T> { success: boolean; message: string; data: T; meta?: Record<string, unknown>; }
export interface Product { id: number; slug: string; name: string; category_name?: string; condition_type: 'new' | 'second_hand'; sale_enabled: boolean; rental_enabled: boolean; sale_price_eur?: number | null; sale_price_aoa?: number | null; rental_price_per_day_eur?: number | null; image_url?: string; }
export interface User { id: number; role: Role; first_name: string; last_name: string; email: string; preferred_language?: Language; branch_id?: number | null; }
