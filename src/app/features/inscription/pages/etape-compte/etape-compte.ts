
import { Component, signal, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';

import { InscriptionService } from '../../services/inscription.service';

@Component({
  selector: 'app-etape-compte',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule
  ],
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

  submitted = signal(false);

  repetitionInterdite(value: string): boolean {
    return /([a-zà-ÿ])\1\1/i.test(value);
  }

  emailValide(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      this.email().trim()
    );
  }

  pinIdentique(): boolean {
    return this.pin() === this.confirmationPin();
  }

  formulaireValide(): boolean {
    const prenomValide =
      this.prenom().trim().length >= 2 &&
      !/^\s+$/.test(this.prenom()) &&
      !this.repetitionInterdite(this.prenom());

    const nomValide =
      this.nom().trim().length >= 2 &&
      !/^\s+$/.test(this.nom()) &&
      !this.repetitionInterdite(this.nom());

    const telephoneValide =
      /^(70|75|76|77|78)[0-9]{7}$/.test(
        this.telephone().trim()
      );

    const emailValide =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        this.email().trim()
      );

    const pinValide =
      /^[0-9]{4}$/.test(this.pin());

    const confirmationValide =
      /^[0-9]{4}$/.test(this.confirmationPin()) &&
      this.pin() === this.confirmationPin();

    return (
      prenomValide &&
      nomValide &&
      telephoneValide &&
      emailValide &&
      pinValide &&
      confirmationValide &&
      this.accepteConditions()
    );
  }

  continuer(form: NgForm): void {
    this.submitted.set(true);

    if (!this.formulaireValide()) {
      form.control.markAllAsTouched();
      return;
    }

    this.service
      .inscrireCompte({
        nom: this.nom().trim(),
        prenom: this.prenom().trim(),
        telephone: this.telephone().trim(),
        email: this.email().trim(),
        pin: this.pin(),
        confirmationPin: this.confirmationPin()
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/inscription/otp']);
        }
      });
  }
}

