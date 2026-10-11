import { Component, Input, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  imports: [],
  selector: 'app-navbar',
  templateUrl: './navbar.html',
})
export class Navbar {

  @Input() titre: string = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  utilisateur = this.authService.currentUser;

  nomComplet = computed(() => {
    const u = this.utilisateur();
    return u ? `${u.prenom} ${u.nom}` : '';
  });

  initiales = computed(() => {
    const u = this.utilisateur();
    if (!u) return '';
    return `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();
  });

  deconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
