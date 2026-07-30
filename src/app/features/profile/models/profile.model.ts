export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  joinedDate: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
}

export interface BookingHistoryItem {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldImageUrl: string;
  date: string;
  timeSlots: string; // e.g., "16:00 - 17:30"
  totalPrice: number;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  isReviewed?: boolean;
}

export interface WishlistItem {
  fieldId: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  price: number;
  address: string;
}

export interface ReviewRequest {
  bookingId: string;
  fieldId: string;
  rating: number;
  comment: string;
}
