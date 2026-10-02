import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../../core/services/auth.service';
import { FirebaseService } from '../../../../core/services/firebase.service';
import { Router } from '@angular/router';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    PasswordModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
  ],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {

  telephone = signal('');
  codePin = signal('');

  protected authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

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
          this.router.navigate(['/mon-espace']);
        }
      },
      error: (err) => {
        this.authService.errorMessage.set(err?.error?.detail ?? 'Identifiants incorrects');
      }
    });
  }
}
