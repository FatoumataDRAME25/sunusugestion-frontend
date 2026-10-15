import { Component, HostListener, Input, OnInit, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationItem, NotificationService } from '../../../core/services/notification.service';
import { AbonnementService } from '../../../core/services/abonnement.service';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-navbar',
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {

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

  // ── Notifications ─────────────────────────────────────────
  protected notificationService = inject(NotificationService);

  notificationsOuvertes = signal(false);

  // Icône et couleur selon le module de la notification
  readonly iconesModules: Record<string, string> = {
    activites: 'pi-calendar',
    cotisations: 'pi-wallet',
    prets: 'pi-credit-card',
    membres: 'pi-users',
    general: 'pi-bell',
  };

  // ── Abonnement du groupement (bandeau d'alerte) ────────────
  protected abonnementService = inject(AbonnementService);

  bandeauAbonnement = computed(() => {
    const role = this.utilisateur()?.role;
    return this.abonnementService.messageBandeau(
      this.abonnementService.abonnement(),
      role === 'president' || role === 'tresorier'
    );
  });

  ngOnInit(): void {
    // Chaque page a sa barre du haut : les notifications sont donc
    // rechargées à chaque changement de page, sans minuteur.
    this.notificationService.rafraichir();
    this.abonnementService.rafraichir();
  }

  ouvrirNotifications(): void {
    this.notificationsOuvertes.set(true);
    this.notificationService.rafraichir();
  }

  @HostListener('document:keydown.escape')
  fermerNotifications(): void {
    this.notificationsOuvertes.set(false);
  }

  ouvrirNotification(notification: NotificationItem): void {
    this.notificationService.marquerCommeLue(notification);
    this.fermerNotifications();
    this.router.navigateByUrl(this.notificationService.routeDe(notification));
  }

  deconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
