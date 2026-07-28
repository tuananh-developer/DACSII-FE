import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { Voucher, BookingRequest } from '../../models/booking.model';

@Component({
  selector: 'app-booking-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './booking-checkout.component.html'
})
export class BookingCheckoutComponent implements OnInit {
  bookingData = signal<any>(null);
  voucherCode = signal<string>('');
  appliedVoucher = signal<Voucher | null>(null);
  isApplyingVoucher = signal(false);
  isSubmitting = signal(false);
  note = signal<string>('');

  constructor(
    private router: Router,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    const dataStr = localStorage.getItem('pending_booking');
    if (dataStr) {
      this.bookingData.set(JSON.parse(dataStr));
    } else {
      this.router.navigate(['/']); // redirect to home if no pending booking
    }
  }

  get finalPrice(): number {
    const data = this.bookingData();
    if (!data) return 0;
    let price = data.totalPrice;
    const v = this.appliedVoucher();
    if (v) {
      const discount = Math.min((price * v.discountPercentage) / 100, v.maxDiscount);
      price -= discount;
    }
    return price;
  }

  applyVoucher() {
    if (!this.voucherCode()) return;
    this.isApplyingVoucher.set(true);
    this.bookingService.applyVoucher(this.voucherCode()).subscribe({
      next: (voucher) => {
        if (voucher) {
          this.appliedVoucher.set(voucher);
        } else {
          alert('Mã giảm giá không hợp lệ hoặc đã hết hạn');
          this.appliedVoucher.set(null);
        }
        this.isApplyingVoucher.set(false);
      },
      error: () => {
        this.isApplyingVoucher.set(false);
      }
    });
  }

  removeVoucher() {
    this.appliedVoucher.set(null);
    this.voucherCode.set('');
  }

  submitBooking() {
    const data = this.bookingData();
    if (!data) return;

    this.isSubmitting.set(true);
    const request: BookingRequest = {
      fieldId: data.fieldId,
      date: data.date,
      timeSlotIds: data.slots.map((s: any) => s.id),
      note: this.note(),
      voucherCode: this.appliedVoucher()?.code
    };

    this.bookingService.createBooking(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        // Save response for success page or redirect to payment
        localStorage.removeItem('pending_booking');
        
        // Mock payment redirect
        if (response.paymentUrl) {
           // Simulate redirecting to VNPay
           window.location.href = `/booking/success?id=${response.id}`;
        } else {
           this.router.navigate(['/booking/success'], { queryParams: { id: response.id } });
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        alert('Có lỗi xảy ra khi tạo đơn đặt sân');
      }
    });
  }
}
