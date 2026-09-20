import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard = (target: 'login' | 'lobby' = 'lobby'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const loggedIn = auth.isLoggedIn();

    if (target === 'login') {
      return loggedIn ? router.createUrlTree(['/lobby']) : true;
    }
    return loggedIn ? true : router.createUrlTree(['/login']);
  };
};