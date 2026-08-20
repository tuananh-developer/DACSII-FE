import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FieldService, Field, resolveImageUrl } from '../../home/services/field.service';
import { BookingService } from '../../booking/services/booking.service';
import { TimeSlot } from '../../booking/models/booking.model';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationDropdownComponent } from '../../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-field-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationDropdownComponent],
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

  // Lightbox state
  selectedImageIndex = signal<number | null>(null);
  isZoomed = signal<boolean>(false);

  currentLightboxUrl = computed(() => {
    const idx = this.selectedImageIndex();
    if (idx === null) return null;
    const images = this.field()?.images;
    if (images && images.length > 0 && images[idx]) {
      return images[idx].url;
    }
    return this.field()?.imageUrl || null;
  });

  openLightbox(url: string | undefined | null) {
    if (!url) return;
    const images = this.field()?.images || [];
    let idx = images.findIndex((img: any) => img.url === url);
    if (idx === -1) idx = 0;
    this.selectedImageIndex.set(idx);
    this.isZoomed.set(false);
  }

  closeLightbox() {
    this.selectedImageIndex.set(null);
    this.isZoomed.set(false);
  }

  nextImage(event?: Event) {
    if (event) event.stopPropagation();
    const images = this.field()?.images || [];
    if (images.length <= 1) return;
    const currentIndex = this.selectedImageIndex();
    if (currentIndex !== null) {
      this.selectedImageIndex.set((currentIndex + 1) % images.length);
      this.isZoomed.set(false);
    }
  }

  prevImage(event?: Event) {
    if (event) event.stopPropagation();
    const images = this.field()?.images || [];
    if (images.length <= 1) return;
    const currentIndex = this.selectedImageIndex();
    if (currentIndex !== null) {
      this.selectedImageIndex.set((currentIndex - 1 + images.length) % images.length);
      this.isZoomed.set(false);
    }
  }

  toggleZoom(event?: Event) {
    if (event) event.stopPropagation();
    this.isZoomed.update(z => !z);
  }

  reviews = signal<any[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fieldService: FieldService,
    private bookingService: BookingService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.fieldId = this.route.snapshot.paramMap.get('id') || '';
    if (this.fieldId) {
      this.fieldService.getFieldDetails(this.fieldId).subscribe({
        next: (res: any) => {
          const data = res.data || res;

          let imagesList: any[] = [];
          if (Array.isArray(data.images)) {
            imagesList = data.images.map((img: any) => {
              const rawUrl = typeof img === 'string' ? img : (img.url || img.image_url || img.imageUrl || img.path || '');
              return { url: resolveImageUrl(rawUrl), is_primary: img.is_primary || false };
            }).filter((img: any) => !!img.url);
          }

          const primaryImage = imagesList.find((img: any) => img.is_primary)?.url || (imagesList.length > 0 ? imagesList[0].url : null);
          const branchAddress = data.branch?.address
            ? `${data.branch.address.street ? data.branch.address.street + ', ' : ''}${data.branch.address.ward_name ? data.branch.address.ward_name + ', ' : ''}${data.branch.address.city_name || ''}`.replace(/,\s*$/, '')
            : (data.address || data.branch?.name || 'Chưa cập nhật địa chỉ');

          const formatted: Field = {
            ...data,
            images: imagesList,
            imageUrl: primaryImage || resolveImageUrl(data.imageUrl || data.image_url) || '',
            rating: data.rating !== undefined && data.rating !== null ? Number(data.rating) : null,
            reviewsCount: data.reviewsCount !== undefined && data.reviewsCount !== null ? Number(data.reviewsCount) : (Array.isArray(data.reviews) ? data.reviews.length : 0),
            price: data.base_price !== undefined ? Number(data.base_price) : (data.price !== undefined ? Number(data.price) : 200000),
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

  get computedBasePrice(): number {
    const slots = this.timeSlots();
    if (slots && slots.length > 0) {
      return Math.min(...slots.map(s => s.price));
    }
    return this.field()?.price || 200000;
  }

  get totalBookingPrice(): number {
    const slots = this.timeSlots();
    const selected = this.selectedSlotIds();
    return selected.reduce((total, id) => {
      const slot = slots.find(s => s.id === id);
      return total + (slot ? slot.price : 0);
    }, 0);
  }

  goToCheckout() {
    if (this.selectedSlotIds().length === 0) return;

    // Store selected booking data in local storage before navigating
    const bookingData = {
      fieldId: this.fieldId,
      field: this.field(),
      date: this.selectedDate(),
      slots: this.timeSlots().filter(s => this.selectedSlotIds().includes(s.id)),
      totalPrice: this.totalBookingPrice
    };
    localStorage.setItem('pending_booking', JSON.stringify(bookingData));

    const token = localStorage.getItem('access_token');
    if (!token && !this.authService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/booking/checkout']);
  }
}
