import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { Voucher, BookingRequest } from '../../models/booking.model';

// --- Strategy Pattern for Payments ---
export interface PaymentStrategy {
  pay(amount: number, response: any, router: Router): void;
}

export class VNPayStrategy implements PaymentStrategy {
  pay(amount: number, response: any, router: Router): void {
    if (response.paymentUrl) {
      window.location.href = response.paymentUrl;
    } else {
      router.navigate(['/booking/success'], { queryParams: { id: response.id, method: 'vnpay' } });
    }
  }
}

export class MomoStrategy implements PaymentStrategy {
  pay(amount: number, response: any, router: Router): void {
    if (response.momoUrl) {
      window.location.href = response.momoUrl;
    } else {
      router.navigate(['/booking/success'], { queryParams: { id: response.id, method: 'momo' } });
    }
  }
}

export class PaymentContext {
  private strategy: PaymentStrategy;

  constructor(strategy: PaymentStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: PaymentStrategy) {
    this.strategy = strategy;
  }

  executeStrategy(amount: number, response: any, router: Router) {
    this.strategy.pay(amount, response, router);
  }
}
// -----------------------------------

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
  paymentMethod = 'vnpay'; // Bound to radio buttons
  paymentContext = new PaymentContext(new VNPayStrategy());

  constructor(
    public router: Router,
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

    // Update strategy based on user selection
    if (this.paymentMethod === 'momo') {
      this.paymentContext.setStrategy(new MomoStrategy());
    } else {
      this.paymentContext.setStrategy(new VNPayStrategy());
    }

    this.bookingService.createBooking(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        localStorage.removeItem('pending_booking');
        
        // Execute Payment Strategy
        this.paymentContext.executeStrategy(this.finalPrice, response, this.router);
      },
      error: () => {
        this.isSubmitting.set(false);
        alert('Có lỗi xảy ra khi tạo đơn đặt sân');
      }
    });
  }
}
