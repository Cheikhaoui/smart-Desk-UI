import { Routes } from '@angular/router';

import { guestGuard } from '../../core/auth/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login.component').then((m) => m.LoginComponent),
    title: 'Sign In'
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./register.component').then((m) => m.RegisterComponent),
    title: 'Create Account'
  }
];

export default routes;
