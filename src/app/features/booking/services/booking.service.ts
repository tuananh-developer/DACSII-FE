import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { TimeSlot, Voucher, BookingRequest, BookingResponse } from '../models/booking.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  // Get available time slots for a specific field and date
  getAvailableTimeSlots(fieldId: string, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/slots`, { params: { fieldId, date } });
  }

  // Validate and apply voucher
  applyVoucher(code: string): Observable<Voucher | null> {
    return this.http.post<Voucher>(`${this.apiUrl}/vouchers/apply`, { code });
  }

  // Create booking
  createBooking(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, request);
  }
}
