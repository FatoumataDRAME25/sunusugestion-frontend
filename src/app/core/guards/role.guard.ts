import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/utilisateur.model';

/**
 * Vérifie que l'utilisateur connecté possède l'un des rôles autorisés.
 *
 * Utilisation dans app.routes.ts :
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['president', 'secretaire'] }
 *
 * Redirige vers /mon-espace si le rôle n'est pas autorisé.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolesAutorises: Role[] = route.data['roles'] ?? [];
  const roleUtilisateur = authService.currentUser()?.role;

  if (roleUtilisateur && rolesAutorises.includes(roleUtilisateur)) {
    return true;
  }

  return router.createUrlTree(['/mon-espace']);
};
