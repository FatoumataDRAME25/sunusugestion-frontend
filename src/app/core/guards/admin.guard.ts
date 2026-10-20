import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Vérifie que l'utilisateur connecté est l'administrateur plateforme.
 * Redirige vers /login si non connecté, vers /mon-espace si connecté mais pas admin.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Un utilisateur mémorisé ne suffit pas : sans jeton de renouvellement,
  // toutes les requêtes partiraient sans authentification.
  if (!authService.isAuthenticated() || !authService.getRefreshToken()) {
    if (authService.isAuthenticated()) {
      authService.logout();   // session à moitié effacée
    }
    return router.createUrlTree(['/login']);
  }

  if (authService.currentUser()?.role === 'administrateur') {
    return true;
  }

  return router.createUrlTree(['/mon-espace']);
};
