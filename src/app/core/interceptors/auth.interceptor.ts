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
          // If user has NO token at all (guest user on public page), DO NOT refresh and DO NOT redirect!
          if (!token) {
            return throwError(() => error);
          }

          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);
            
            const http = new HttpClient(httpBackend);
            
            return http.post<any>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
              switchMap((res) => {
                isRefreshing = false;
                const newToken = res?.accessToken || res?.access_token || res?.data?.accessToken || res?.data?.access_token;
                if (newToken) {
                  localStorage.setItem('access_token', newToken);
                  refreshTokenSubject.next(newToken);
                  const retriedReq = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${newToken}`),
                    withCredentials: true
                  });
                  return next(retriedReq);
                }
                
                localStorage.removeItem('access_token');
                refreshTokenSubject.next(null);
                return throwError(() => new Error('Refresh failed'));
              }),
              catchError((refreshError) => {
                isRefreshing = false;
                refreshTokenSubject.next(null);
                localStorage.removeItem('access_token');
                return throwError(() => refreshError);
              })
            );
          } else {
            return refreshTokenSubject.pipe(
              filter(t => t !== null),
              take(1),
              switchMap((t) => {
                const retriedReq = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${t}`),
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
