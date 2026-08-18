import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, switchMap } from 'rxjs';
import { UserProfile, BookingHistoryItem, WishlistItem, ReviewRequest } from '../models/profile.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/users/me`;

  constructor(private http: HttpClient) {}

  private mapToUserProfile(response: any): UserProfile {
    return {
      id: response.userProfile?.id || response.id,
      name: response.userProfile?.full_name || '',
      email: response.email || '',
      phone: response.userProfile?.phone_number || '',
      avatarUrl: response.userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.userProfile?.full_name || 'User')}&background=random`,
      joinedDate: response.created_at,
      dateOfBirth: response.userProfile?.date_of_birth ? response.userProfile.date_of_birth.substring(0, 10) : undefined,
      gender: response.userProfile?.gender,
      bio: response.userProfile?.bio
    };
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => this.mapToUserProfile(response))
    );
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    const payload: any = {};

    if (data.name !== undefined && data.name !== null) {
      const trimmed = data.name.trim();
      if (trimmed) payload.full_name = trimmed;
    }
    if (data.phone !== undefined && data.phone !== null) {
      const trimmed = data.phone.trim();
      if (trimmed) payload.phone_number = trimmed;
    }
    if (data.dateOfBirth !== undefined && data.dateOfBirth !== null) {
      const trimmedDate = data.dateOfBirth.trim();
      if (trimmedDate) {
        const dateObj = new Date(trimmedDate);
        payload.date_of_birth = isNaN(dateObj.getTime()) ? trimmedDate : dateObj.toISOString();
      }
    }
    if (data.gender !== undefined && data.gender !== null) {
      payload.gender = data.gender;
    }
    if (data.bio !== undefined && data.bio !== null) {
      payload.bio = data.bio.trim();
    }

    return this.http.put<any>(`${this.apiUrl}/profile`, payload).pipe(
      switchMap(() => this.getProfile())
    );
  }

  getBookings(): Observable<BookingHistoryItem[]> {
    return this.http.get<BookingHistoryItem[]>(`${environment.apiUrl}/bookings/me`);
  }

  getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${environment.apiUrl}/users/me/wishlist`);
  }

  submitReview(review: ReviewRequest): Observable<boolean> {
    return this.http.post<boolean>(`${environment.apiUrl}/reviews`, review);
  }
}
