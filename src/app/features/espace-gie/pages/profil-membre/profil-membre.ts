import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../../../../core/services/auth.service';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-profil-membre',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PasswordModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    InitialesPipe,
    BottomNav
  ],
  styleUrl: './profil-membre.css',
  templateUrl: './profil-membre.html',
})
export class ProfilMembre {
  protected authService = inject(AuthService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private readonly BASE_URL = environment.API_URL;

  isSaving = signal(false);
  succes = signal(false);
  errorMessage = signal<string | null>(null);

  // Section sécurité visible ou non
  securityExpanded = signal(true);

  // Formulaire infos personnelles
  formInfos: FormGroup = this.fb.group({
    telephone: [this.authService.currentUser()?.telephone ?? '', Validators.required],
    email:     [this.authService.currentUser()?.email ?? '']
  });

  // Formulaire changement de PIN
  formPin: FormGroup = this.fb.group({
    pinActuel:       ['', Validators.required],
    nouveauPin:      ['', [Validators.required, Validators.minLength(4)]],
    confirmationPin: ['', Validators.required]
  });

  get telephone()       { return this.formInfos.get('telephone')!; }
  get pinActuel()       { return this.formPin.get('pinActuel')!; }
  get nouveauPin()      { return this.formPin.get('nouveauPin')!; }
  get confirmationPin() { return this.formPin.get('confirmationPin')!; }

  enregistrer(): void {
    if (this.formInfos.invalid) {
      this.formInfos.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const userId = this.authService.currentUser()?.id;

    this.http.patch(
      `${this.BASE_URL}membres/membres/${userId}/`,
      this.formInfos.value
    ).subscribe({
      next: (reponse: any) => {
        // Met à jour le signal currentUser avec les nouvelles infos
        this.authService.updateProfil({
          telephone: this.formInfos.value.telephone,
          email: this.formInfos.value.email
        });
        this.isSaving.set(false);
        this.succes.set(true);
        this.formInfos.markAsPristine();
        setTimeout(() => this.succes.set(false), 3000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de la sauvegarde');
      }
    });
  }
}
