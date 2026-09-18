import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {

  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  confirmerDeconnexion(): void {
  this.confirmationService.confirm({
    header: 'Déconnexion',
    message: 'Voulez-vous vous déconnecter ? Vous devrez ressaisir vos identifiants pour accéder de nouveau à votre espace.',
    icon: 'pi pi-sign-out',
    type: 'danger',
    acceptButtonProps: {
      label: 'Se déconnecter',
      severity: 'danger',
      pt: { root: { class: 'w-4/5' } }
    },
    rejectButtonProps: {
      label: 'Annuler',
      text: true,
      pt: { root: { class: 'w-4/5' } }
    },
    accept: () => {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  } as any);
}
}
