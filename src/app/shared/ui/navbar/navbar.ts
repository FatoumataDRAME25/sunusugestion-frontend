import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  imports: [RouterLink],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {

  private authService        = inject(AuthService);
  private router             = inject(Router);
  protected notifService     = inject(NotificationService);

  menuOuvert = signal(false);

  estPresident = computed(() => this.authService.currentUser()?.role === 'president');

  ngOnInit(): void {
    // Charger les badges au démarrage de la navbar
    this.notifService.getBadges().subscribe();
  }

  toggleMenu(): void {
    this.menuOuvert.set(!this.menuOuvert());
  }

  fermerMenu(): void {
    this.menuOuvert.set(false);
  }

  // Modules qui ont une page détail par ID dans Angular
  private readonly MODULES_AVEC_DETAIL = new Set(['activites', 'prets']);

  ouvrirModule(module: string, routeListe: string): void {
    const badge = (this.notifService.badges() as any)[module];
    const count = badge?.count ?? 0;
    const objetId = badge?.dernierObjetId ?? null;

    this.notifService.marquerModuleCommeLu(module).subscribe();
    this.fermerMenu();

    // 1 notification non lue + objet_id connu + module avec page détail
    // → naviguer directement vers le détail
    if (count === 1 && objetId && this.MODULES_AVEC_DETAIL.has(module)) {
      this.router.navigate([`/mon-espace/${module}/${objetId}`]);
    } else {
      // Plusieurs notifications ou module sans détail → liste
      this.router.navigate([routeListe]);
    }
  }

  deconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
