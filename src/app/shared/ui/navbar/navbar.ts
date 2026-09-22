import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  imports: [RouterLink],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  private authService = inject(AuthService);
  private router = inject(Router);

  menuOuvert = signal(false);

  estPresident = computed(() => this.authService.currentUser()?.role === 'president');

  toggleMenu(): void {
    this.menuOuvert.set(!this.menuOuvert());
  }

  fermerMenu(): void {
    this.menuOuvert.set(false);
  }

  deconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
