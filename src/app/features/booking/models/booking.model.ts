export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  type?: string; // '5', '7', '11'
}

export interface Voucher {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscount: number;
}

export interface BookingRequest {
  fieldId: string;
  date: string; // YYYY-MM-DD
  timeSlotIds: string[];
  note?: string;
  voucherCode?: string;
}

export interface BookingResponse {
  id: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentUrl?: string;
}
