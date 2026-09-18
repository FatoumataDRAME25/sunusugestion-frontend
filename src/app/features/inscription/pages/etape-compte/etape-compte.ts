// features/inscription/pages/etape-compte/etape-compte.ts
import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';

import { InscriptionService } from '../../services/inscription.service';

@Component({
  selector: 'app-etape-compte',
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, CheckboxModule],
  templateUrl: './etape-compte.html'
})
export class EtapeCompte {
  protected service = inject(InscriptionService);
  private router = inject(Router);

  prenom = signal('');
  nom = signal('');
  telephone = signal('');
  email = signal('');
  pin = signal('');
  confirmationPin = signal('');
  accepteConditions = signal(false);

  erreurConfirmation = signal<string | null>(null);

  continuer(): void {
    if (this.pin() !== this.confirmationPin()) {
      this.erreurConfirmation.set('Les codes ne correspondent pas');
      return;
    }
    this.erreurConfirmation.set(null);

    this.service
      .inscrireCompte({
        nom: this.nom(),
        prenom: this.prenom(),
        telephone: this.telephone(),
        email: this.email() || undefined,
        pin: this.pin(),
        confirmationPin: this.confirmationPin()
      })
      .subscribe({
        next: () => this.router.navigate(['/inscription/otp'])
      });
  }
}
