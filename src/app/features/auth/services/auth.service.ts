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

  constructor(private api: ApiService, private notificationService: NotificationService) {
    this.initAuth();
  }

  private initAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.fetchCurrentUser().subscribe({
        error: () => this.logout().subscribe()
      });
    }
  }

  // 0. Fetch Current User
  fetchCurrentUser(): Observable<any> {
    return this.api.get('/users/me').pipe(
      tap((user: any) => {
        // the backend /users/me returns AccountResponseDto. 
        // We need to map it to the frontend User interface
        const roleName = user.role ? (typeof user.role === 'object' ? user.role.name : user.role) : '';
        const mappedUser: User = {
          id: user.id,
          email: user.email,
          full_name: user.userProfile?.full_name || '',
          avatar_url: user.userProfile?.avatar_url,
          role: roleName,
          is_profile_complete: user.userProfile?.is_profile_complete ?? false,
        };
        this.currentUser.set(mappedUser);
        this.notificationService.connect(mappedUser.id);
      })
    );
  }

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
