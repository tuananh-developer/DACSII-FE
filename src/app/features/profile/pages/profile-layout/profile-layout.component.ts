import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationDropdownComponent } from '../../../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './profile-layout.component.html'
})
export class ProfileLayoutComponent {
  navItems = [
    { label: 'Hồ sơ cá nhân', path: '/profile/info' },
    { label: 'Lịch sử đặt sân', path: '/profile/bookings' },
    { label: 'Sân yêu thích', path: '/profile/wishlist' }
  ];
}
