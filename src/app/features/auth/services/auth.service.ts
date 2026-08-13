import { Injectable, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  is_profile_complete?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor(private api: ApiService, private notificationService: NotificationService) {}

  // 1. Initiate Login
  loginInitiate(email: string, password: string): Observable<any> {
    return this.api.post('/auth/login/initiate', { email, password });
  }

  setAuthData(accessToken: string, user: User) {
    localStorage.setItem('access_token', accessToken);
    this.currentUser.set(user);
    this.notificationService.connect(user.id);
    this.notificationService.loadInitialNotifications();
  }

  // 2. Complete Login with OTP
  loginComplete(email: string, verificationCode: string): Observable<any> {
    return this.api.post('/auth/login/complete', { email, verificationCode }).pipe(
      tap((res: any) => {
        if (res.accessToken) {
          this.setAuthData(res.accessToken, res.user);
        }
      })
    );
  }

  // 3. Initiate Register
  registerInitiate(userData: any): Observable<any> {
    return this.api.post('/auth/register/initiate', userData);
  }

  // 4. Complete Register with OTP
  registerComplete(email: string, verificationCode: string): Observable<any> {
    return this.api.post('/auth/register/complete', { email, verificationCode }).pipe(
      tap((res: any) => {
        if (res.accessToken) {
          this.setAuthData(res.accessToken, res.user);
        }
      })
    );
  }

  // 5. Logout
  logout(): Observable<any> {
    return this.api.post('/auth/logout', {}).pipe(
      tap(() => {
        localStorage.removeItem('access_token');
        this.currentUser.set(null);
        this.notificationService.disconnect();
      })
    );
  }
}
