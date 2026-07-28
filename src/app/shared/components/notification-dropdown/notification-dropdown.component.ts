import { Component, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-dropdown.component.html',
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }),
        animate('150ms cubic-bezier(0.2, 0, 0, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }))
      ])
    ])
  ]
})
export class NotificationDropdownComponent implements OnInit {
  isOpen = signal(false);
  unreadCount = signal(0);
  notifications = signal<AppNotification[]>([]);

  constructor(
    private notificationService: NotificationService,
    private eRef: ElementRef
  ) {}

  ngOnInit() {
    this.notificationService.unreadCount$.subscribe(count => this.unreadCount.set(count));
    this.notificationService.notifications$.subscribe(notifs => this.notifications.set(notifs));
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if(!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  markAsRead(id: string, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(id);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'BOOKING_SUCCESS':
        return '<svg viewBox="0 0 32 32" class="w-5 h-5 fill-green-500"><path d="M12.7 26a1 1 0 0 1-.7-.3l-8-8a1 1 0 0 1 1.4-1.4l7.3 7.3L26.6 6.3a1 1 0 0 1 1.4 1.4l-14.6 18a1 1 0 0 1-.7.3z"></path></svg>';
      case 'REMINDER':
        return '<svg viewBox="0 0 32 32" class="w-5 h-5 fill-yellow-500"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"></path><path d="M17 8h-2v9h8v-2h-6z"></path></svg>';
      case 'CANCELLED':
        return '<svg viewBox="0 0 32 32" class="w-5 h-5 fill-red-500"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"></path><path d="M21.4 10.6l-1.4-1.4L16 13.2l-4-4-1.4 1.4 4 4-4 4 1.4 1.4 4-4 4 4 1.4-1.4-4-4z"></path></svg>';
      default:
        return '<svg viewBox="0 0 32 32" class="w-5 h-5 fill-primary"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"></path><circle cx="16" cy="16" r="3"></circle></svg>';
    }
  }
}
