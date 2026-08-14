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

}
