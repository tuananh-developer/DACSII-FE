import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { BookingHistoryItem } from '../../models/profile.model';
import { BookingTableComponent } from '../../components/booking-table.component';

@Component({
  selector: 'app-profile-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BookingTableComponent],
  templateUrl: './profile-bookings.component.html'
})
export class ProfileBookingsComponent implements OnInit {
  bookings = signal<BookingHistoryItem[]>([]);
  isLoading = signal(true);
  
  activeTab = signal<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');

  filteredBookings = computed(() => {
    return this.bookings().filter(b => b.status === this.activeTab());
  });

  // Review Modal state
  showReviewModal = signal(false);
  selectedBooking = signal<BookingHistoryItem | null>(null);
  reviewRating = signal(0);
  hoverRating = 0;
  reviewComment = signal('');
  isSubmittingReview = signal(false);

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.profileService.getBookings().subscribe(data => {
      this.bookings.set(data);
      this.isLoading.set(false);
    });
  }

  setTab(tab: 'UPCOMING' | 'COMPLETED' | 'CANCELLED') {
    this.activeTab.set(tab);
  }

  openReviewModal(booking: BookingHistoryItem) {
    this.selectedBooking.set(booking);
    this.reviewRating.set(0);
    this.reviewComment.set('');
    this.showReviewModal.set(true);
  }

  closeReviewModal() {
    this.showReviewModal.set(false);
    this.selectedBooking.set(null);
  }

  setRating(stars: number) {
    this.reviewRating.set(stars);
  }

  submitReview() {
    const booking = this.selectedBooking();
    if (!booking || this.reviewRating() === 0) return;

    this.isSubmittingReview.set(true);
    this.profileService.submitReview({
      bookingId: booking.id,
      fieldId: booking.fieldId,
      rating: this.reviewRating(),
      comment: this.reviewComment()
    }).subscribe(() => {
      this.isSubmittingReview.set(false);
      this.closeReviewModal();
      
      // Update local state to mark as reviewed
      this.bookings.update(items => items.map(item => 
        item.id === booking.id ? { ...item, isReviewed: true } : item
      ));
    });
  }
}
