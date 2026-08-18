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

  reviews = signal<any[]>([]);

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
          
          const imagesList = data.images && Array.isArray(data.images) ? data.images : [];
          const primaryImage = imagesList.find((img: any) => img.is_primary)?.url || (imagesList.length > 0 ? imagesList[0].url : null);
          const branchAddress = data.branch?.address 
            ? `${data.branch.address.street ? data.branch.address.street + ', ' : ''}${data.branch.address.ward_name ? data.branch.address.ward_name + ', ' : ''}${data.branch.address.city_name || ''}`.replace(/,\s*$/, '')
            : (data.address || data.branch?.name || 'Chưa cập nhật địa chỉ');

          const formatted: Field = {
            ...data,
            images: imagesList,
            imageUrl: primaryImage || data.imageUrl || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
            rating: data.rating !== undefined && data.rating !== null ? Number(data.rating) : null,
            reviewsCount: data.reviewsCount !== undefined && data.reviewsCount !== null ? Number(data.reviewsCount) : (Array.isArray(data.reviews) ? data.reviews.length : 0),
            price: data.base_price !== undefined ? Number(data.base_price) : (data.price !== undefined ? Number(data.price) : 0),
            address: branchAddress,
            fieldTypeName: data.fieldType?.name || data.field_type?.name || 'Sân bóng đá',
            branchName: data.branch?.name || 'Hệ thống NexusSport'
          };
          
          this.field.set(formatted);
          this.isLoading.set(false);
          this.loadTimeSlots(); // Load slots for default date
          this.loadReviews();
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  loadReviews() {
    this.fieldService.getFieldReviews(this.fieldId).subscribe({
      next: (res: any) => {
        const data = res.data || res.items || res;
        if (Array.isArray(data)) {
          this.reviews.set(data);
          if (this.field()) {
            this.field.update(f => f ? { ...f, reviewsCount: f.reviewsCount || data.length } : null);
          }
        } else {
          this.reviews.set([]);
        }
      },
      error: () => {
        this.reviews.set([]);
      }
    });
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
