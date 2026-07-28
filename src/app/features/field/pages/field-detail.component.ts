import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FieldService, Field } from '../../home/services/field.service';
import { BookingService } from '../../booking/services/booking.service';
import { TimeSlot } from '../../booking/models/booking.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-field-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './field-detail.component.html'
})
export class FieldDetailComponent implements OnInit {
  fieldId = '';
  field = signal<Field | null>(null);
  isLoading = signal(true);
  
  // Booking state
  today = new Date();
  selectedDate = signal<string>(this.today.toISOString().split('T')[0]); // Default today YYYY-MM-DD
  timeSlots = signal<TimeSlot[]>([]);
  isLoadingSlots = signal(false);
  selectedSlotIds = signal<string[]>([]);
  showDatePicker = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fieldService: FieldService,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    this.fieldId = this.route.snapshot.paramMap.get('id') || '';
    if (this.fieldId) {
      this.fieldService.getFieldDetails(this.fieldId).subscribe({
        next: (res: any) => {
          const data = res.data || res;
          
          // Format data for UI
          const formatted: Field = {
            ...data,
            imageUrl: data.images && data.images.length > 0 ? data.images[0].url : 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
            rating: data.rating || 4.9,
            reviewsCount: data.reviewsCount || 128,
            price: data.base_price || data.price || 250000
          };
          
          this.field.set(formatted);
          this.isLoading.set(false);
          this.loadTimeSlots(); // Load slots for default date
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  loadTimeSlots() {
    if (!this.fieldId) return;
    this.isLoadingSlots.set(true);
    this.bookingService.getAvailableTimeSlots(this.fieldId, this.selectedDate()).subscribe({
      next: (slots) => {
        this.timeSlots.set(slots);
        this.isLoadingSlots.set(false);
        this.selectedSlotIds.set([]); // Reset selections on new date
      },
      error: () => {
        this.isLoadingSlots.set(false);
      }
    });
  }

  onDateChange(event: any) {
    const newDate = event.target.value;
    if (newDate) {
      this.selectedDate.set(newDate);
      this.loadTimeSlots();
      this.showDatePicker.set(false);
    }
  }

  toggleSlot(slotId: string, isAvailable: boolean) {
    if (!isAvailable) return;
    
    this.selectedSlotIds.update(ids => {
      if (ids.includes(slotId)) {
        return ids.filter(id => id !== slotId);
      } else {
        return [...ids, slotId];
      }
    });
  }

  get totalBookingPrice(): number {
    const slots = this.timeSlots();
    return this.selectedSlotIds().reduce((total, id) => {
      const slot = slots.find(s => s.id === id);
      return total + (slot ? slot.price : 0);
    }, 0);
  }

  goToCheckout() {
    if (this.selectedSlotIds().length === 0) return;
    
    // Store selected booking data in local storage or state management before navigating
    const bookingData = {
      fieldId: this.fieldId,
      field: this.field(),
      date: this.selectedDate(),
      slots: this.timeSlots().filter(s => this.selectedSlotIds().includes(s.id)),
      totalPrice: this.totalBookingPrice
    };
    localStorage.setItem('pending_booking', JSON.stringify(bookingData));
    
    this.router.navigate(['/booking/checkout']);
  }
}
