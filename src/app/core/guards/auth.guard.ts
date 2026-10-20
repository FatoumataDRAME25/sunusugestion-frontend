import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Vérifie qu'un utilisateur est connecté.
 * Redirige vers /login si ce n'est pas le cas.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Un utilisateur mémorisé ne suffit pas : sans jeton de renouvellement,
  // toutes les requêtes partiraient sans authentification.
  if (authService.isAuthenticated() && authService.getRefreshToken()) {
    return true;
  }

  // Nettoie une éventuelle session à moitié effacée
  if (authService.isAuthenticated()) {
    authService.logout();
  }

  return router.createUrlTree(['/login']);
};
