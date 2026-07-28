import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { WishlistItem } from '../../models/profile.model';

@Component({
  selector: 'app-profile-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-wishlist.component.html'
})
export class ProfileWishlistComponent implements OnInit {
  wishlist = signal<WishlistItem[]>([]);
  isLoading = signal(true);

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.profileService.getWishlist().subscribe(data => {
      this.wishlist.set(data);
      this.isLoading.set(false);
    });
  }

  removeFromWishlist(fieldId: string, event: Event) {
    event.stopPropagation();
    // Call API to remove, then update list
    this.wishlist.update(items => items.filter(item => item.fieldId !== fieldId));
  }
}
