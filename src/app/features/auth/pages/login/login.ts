import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../../core/services/auth.service';
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
  private router = inject(Router);

  seConnecter(): void {

  this.authService.login(this.telephone(), this.codePin()).subscribe({
    next: () => {
      // currentUser est déjà set par le tap dans AuthService
      const role = this.authService.currentUser()?.role;



      if (role === 'administrateur') {
        this.router.navigate(['/dashboard']);
      } else if (role === 'tresorier') {
        this.router.navigate(['/mon-espace/tableau-bord-tresorier']);
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
