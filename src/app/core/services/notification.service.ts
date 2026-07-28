import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING_SUCCESS' | 'REMINDER' | 'CANCELLED' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket: Socket;
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io(environment.apiUrl.replace('/api', ''), {
      autoConnect: false // Connect manually when authenticated
    });

    this.setupListeners();
    this.loadInitialNotifications();
  }

  connect(userId: string) {
    this.socket.io.opts.query = { userId };
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  private setupListeners() {
    this.socket.on('notification', (newNotification: AppNotification) => {
      const current = this.notificationsSubject.value;
      this.notificationsSubject.next([newNotification, ...current]);
      this.updateUnreadCount();
      // Optionally trigger browser push notification or toast here
    });
  }

  private loadInitialNotifications() {
    this.http.get<AppNotification[]>(`${environment.apiUrl}/notifications`).subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: () => {}
    });
  }

  markAsRead(id: string) {
    this.http.patch(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe({
      next: () => {
        const updated = this.notificationsSubject.value.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(updated);
        this.updateUnreadCount();
      }
    });
  }

  markAllAsRead() {
    this.http.patch(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        const updated = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(updated);
        this.updateUnreadCount();
      }
    });
  }

  private updateUnreadCount() {
    const count = this.notificationsSubject.value.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(count);
  }
}
