import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { AuthService } from '../../../../core/services/auth.service';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-profil',
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, InitialesPipe],
  templateUrl: './profil.html'
})
export class Profil {
  protected authService = inject(AuthService);
  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  // Champs profil
  prenom    = signal(this.authService.currentUser()?.prenom    ?? '');
  nom       = signal(this.authService.currentUser()?.nom       ?? '');
  telephone = signal(this.authService.currentUser()?.telephone ?? '');
  email     = signal(this.authService.currentUser()?.email     ?? '');

  // Champs PIN
  pinActuel      = signal('');
  nouveauPin     = signal('');
  confirmationPin = signal('');

  // États UI
  isSaving       = signal(false);
  isSavingPin    = signal(false);
  succes         = signal(false);
  succesPin      = signal(false);
  errorMessage   = signal<string | null>(null);
  errorMessagePin = signal<string | null>(null);

  enregistrer(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.http.patch(`${this.BASE_URL}auth/profil/`, {
      prenom:    this.prenom(),
      nom:       this.nom(),
      telephone: this.telephone(),
      email:     this.email(),
    }).subscribe({
      next: (reponse: any) => {
        // Met à jour le signal local + localStorage
        this.authService.updateProfil({
          prenom:    reponse.prenom,
          nom:       reponse.nom,
          telephone: reponse.telephone,
          email:     reponse.email,
        });
        this.isSaving.set(false);
        this.succes.set(true);
        setTimeout(() => this.succes.set(false), 3000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          err?.error?.detail ?? err?.error?.telephone?.[0] ?? 'Erreur lors de la sauvegarde.'
        );
      }
    });
  }

  changerPin(): void {
    if (this.nouveauPin() !== this.confirmationPin()) {
      this.errorMessagePin.set('Le nouveau PIN et la confirmation ne correspondent pas.');
      return;
    }

    this.isSavingPin.set(true);
    this.errorMessagePin.set(null);

    this.http.post(`${this.BASE_URL}auth/changer-pin/`, {
      pinActuel:       this.pinActuel(),
      nouveauPin:      this.nouveauPin(),
      confirmationPin: this.confirmationPin(),
    }).subscribe({
      next: () => {
        this.isSavingPin.set(false);
        this.succesPin.set(true);
        this.pinActuel.set('');
        this.nouveauPin.set('');
        this.confirmationPin.set('');
        setTimeout(() => this.succesPin.set(false), 3000);
      },
      error: (err) => {
        this.isSavingPin.set(false);
        this.errorMessagePin.set(
          err?.error?.erreur ?? err?.error?.detail ?? 'Erreur lors du changement de PIN.'
        );
      }
    });
  }
}
