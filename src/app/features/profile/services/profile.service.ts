import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { UserProfile, BookingHistoryItem, WishlistItem, ReviewRequest } from '../models/profile.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrl, data);
  }

  getBookings(): Observable<BookingHistoryItem[]> {
    return this.http.get<BookingHistoryItem[]>(`${this.apiUrl}/bookings`);
  }

  getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${this.apiUrl}/wishlist`);
  }

  submitReview(review: ReviewRequest): Observable<boolean> {
    return this.http.post<boolean>(`${environment.apiUrl}/reviews`, review);
  }
}
