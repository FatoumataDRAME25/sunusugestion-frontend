import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../../core/services/auth.service';
import { FirebaseService } from '../../../../core/services/firebase.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    PasswordModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    RouterLink,
  ],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnDestroy{

  telephone = signal('');
  codePin = signal('');
  pinVisible = false;
  secondesRestantes = signal<number | null>(null);

private intervalleCompteARebours: ReturnType<typeof setInterval> | null = null;

  protected authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);


  /**
 * Démarre le compte à rebours du verrouillage.
 */
private demarrerCompteARebours(secondes: number): void {
  this.arreterCompteARebours();

  this.secondesRestantes.set(secondes);

  this.intervalleCompteARebours = setInterval(() => {
    const restantes = this.secondesRestantes();

  if (restantes === null || restantes <= 1) {
    this.secondesRestantes.set(null);
    this.authService.errorMessage.set(null);
    this.authService.secondesVerrouillage.set(null);
    this.arreterCompteARebours();
    return;
  }

    this.secondesRestantes.set(restantes - 1);
  }, 1000);
}

  /**
   * Arrête le compte à rebours.
   */
  private arreterCompteARebours(): void {
    if (this.intervalleCompteARebours !== null) {
      clearInterval(this.intervalleCompteARebours);
      this.intervalleCompteARebours = null;
    }
  }

  /**
   * Formate les secondes en MM:SS.
   */
  formatTempsRestant(secondes: number): string {
    const minutes = Math.floor(secondes / 60);
    const secondesAffichees = secondes % 60;

    return `${String(minutes).padStart(2, '0')}:${String(secondesAffichees).padStart(2, '0')}`;
  }

  /**
   * Nettoie le compteur lorsque l'on quitte la page.
   */
  ngOnDestroy(): void {
    this.arreterCompteARebours();
  }

  seConnecter(): void {

    this.authService.login(this.telephone(), this.codePin()).subscribe({
      next: () => {
        const role = this.authService.currentUser()?.role;

        // Demander la permission, récupérer le token FCM et l'envoyer à Django.
        // Exécuté dans le contexte d'un clic utilisateur (requis par le navigateur).
        // L'échec n'interrompt pas la navigation.
        this.firebaseService.demanderPermission();

        if (role === 'administrateur') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/mon-espace/dashboard-president']);
        }
      },
      error: (err) => {
        const secondes = this.authService.secondesVerrouillage();

        if (secondes !== null) {
          this.demarrerCompteARebours(secondes);
        }
      }
    });
  }
}
