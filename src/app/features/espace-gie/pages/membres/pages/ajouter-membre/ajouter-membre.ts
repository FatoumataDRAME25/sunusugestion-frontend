import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MembresService } from '../../../../../../core/services/membres.service';
import { RoleMembre } from '../../../../../../core/models/membre.model';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';

@Component({
  selector: 'app-ajouter-membre',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    RouterLink,
    BottomNav
  ],
  templateUrl: './ajouter-membre.html'
})
export class AjouterMembre {
  protected service = inject(MembresService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  modalSuccesVisible = signal(false);

  rolesDisponibles: { label: string; value: RoleMembre }[] = [

    { label: 'Trésorier', value: 'tresorier' },
    { label: 'Secrétaire', value: 'secretaire' },
    { label: 'Membre simple', value: 'membre' }
  ];

  // Définition du formulaire avec ses validations
  form: FormGroup = this.fb.group({
    prenom:    ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)]],
    nom:       ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)]],
    telephone: ['', [Validators.required, Validators.pattern(/^(70|71|75|76|77|78)\d{7}$/)
]],
    email:     ['', [Validators.email]],     // validator natif Angular, optionnel, pas de Validators.required
    role:      [null, [Validators.required]]
  });

  // Raccourcis pour accéder aux champs dans le HTML
  get prenom()    { return this.form.get('prenom')!; }
  get nom()       { return this.form.get('nom')!; }
  get telephone() { return this.form.get('telephone')!; }
  get email()     { return this.form.get('email')!; }
  get role()      { return this.form.get('role')!; }

  soumettre(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.service.isLoading.set(false);
    return;
  }

  const { email, ...donnees } = this.form.value;
  this.service.ajouterMembre(donnees).subscribe({
    next: () => this.modalSuccesVisible.set(true),
    error: (err) => this.service.errorMessage.set(err?.error?.detail ?? 'Une erreur est survenue')
  });
}


  voirLesMembres(): void {
    this.modalSuccesVisible.set(false);
    this.router.navigate(['/mon-espace/membres']);
  }

  ajouterUnAutre(): void {
    this.modalSuccesVisible.set(false);
    this.form.reset();
    this.service.errorMessage.set(null);
  }
}
