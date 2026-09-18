// features/profil/pages/profil/profil.ts
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/services/auth.service';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';

@Component({
  selector: 'app-profil',
  imports: [FormsModule, ButtonModule, InputTextModule, ToastModule, InitialesPipe],
  providers: [MessageService],
  templateUrl: './profil.html'
})
export class Profil {
  protected authService = inject(AuthService);
  private messageService = inject(MessageService);

  prenom = signal(this.authService.currentUser()?.prenom ?? '');
  nom = signal(this.authService.currentUser()?.nom ?? '');
  telephone = signal(this.authService.currentUser()?.telephone ?? '');
  email = signal(this.authService.currentUser()?.email ?? '');

  enregistrer(): void {
    this.authService.updateProfil({
      prenom: this.prenom(),
      nom: this.nom(),
      telephone: this.telephone(),
      email: this.email()
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Profil mis à jour',
      detail: 'Vos informations ont été enregistrées avec succès'
    });
  }
}
