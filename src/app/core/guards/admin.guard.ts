import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { map, of, catchError } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.currentUser();
  if (currentUser) {
    const role = currentUser.role;
    if (role === 'super_admin' || role === 'branch_manager' || role === 'admin' || role === 'manager') {
      return true;
    }
    router.navigate(['/']);
    return false;
  }

  return authService.fetchCurrentUser().pipe(
    map((user: any) => {
      const role = user?.role ? (typeof user.role === 'object' ? user.role.name : user.role) : '';
      if (role === 'super_admin' || role === 'branch_manager' || role === 'admin' || role === 'manager') {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
