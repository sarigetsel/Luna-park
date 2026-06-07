export interface RideRef {
  _id: string;
  name: string;
}

export interface Order {
  _id: string;
  userId: string;
  rideId?: RideRef | string | null;
  ticketType: 'full_day' | 'hourly' | 'ride';
  purchaseDate: string;
  chosenDate: string;
  hoursAmount?: number | null;
  startHour?: number | null;
  endHour?: number | null;
  couponCode?: string | null;
  ticketCode?: string;
  totalPrice: number;
  discountApplied: number;
  finalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
}

export interface CreateOrderDto {
  ticketType: 'full_day' | 'hourly' | 'ride';
  chosenDate: string;
  hoursAmount?: number;
  startHour?: number;
  endHour?: number;
  rideId?: string;
  couponCode?: string;
}

export interface CouponValidation {
  valid: boolean;
  discountPercent?: number;
  message?: string;
}
