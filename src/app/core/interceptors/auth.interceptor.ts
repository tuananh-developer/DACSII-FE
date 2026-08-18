import { HttpInterceptorFn, HttpErrorResponse, HttpClient, HttpBackend } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const httpBackend = inject(HttpBackend);
  
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token');
    let clonedReq = req;
    
    if (token) {
      clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
        withCredentials: true // Ensure cookies (like refresh token) are sent
      });
    } else {
      clonedReq = req.clone({
        withCredentials: true
      });
    }

    return next(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/logout')) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);
            
            const http = new HttpClient(httpBackend);
            
            return http.post<any>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
              switchMap((res) => {
                isRefreshing = false;
                if (res && res.accessToken) {
                  localStorage.setItem('access_token', res.accessToken);
                  refreshTokenSubject.next(res.accessToken);
                  const retriedReq = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`),
                    withCredentials: true
                  });
                  return next(retriedReq);
                }
                
                localStorage.removeItem('access_token');
                refreshTokenSubject.next(null);
                router.navigate(['/']);
                return throwError(() => new Error('Refresh failed'));
              }),
              catchError((refreshError) => {
                isRefreshing = false;
                refreshTokenSubject.next(null);
                localStorage.removeItem('access_token');
                router.navigate(['/']);
                return throwError(() => refreshError);
              })
            );
          } else {
            return refreshTokenSubject.pipe(
              filter(token => token !== null),
              take(1),
              switchMap((token) => {
                const retriedReq = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${token}`),
                  withCredentials: true
                });
                return next(retriedReq);
              })
            );
          }
        }
        return throwError(() => error);
      })
    );
  }
  
  const clonedReq = req.clone({
    withCredentials: true
  });
  return next(clonedReq);
};
