import { Component, computed, inject, signal } from '@angular/core';
import { CotisationService } from '../../../../../../core/services/cotisation.service';
import { MembresService } from '../../../../../../core/services/membres.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';

@Component({
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, InputTextModule, DialogModule, BottomNav],
  selector: 'app-session-cotisation',
  styleUrl: './session-cotisation.css',
  templateUrl: './session-cotisation.html',
})
export class SessionCotisation {
  cotisationService = inject(CotisationService);
  private membresService = inject(MembresService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  voirConfirmation = signal(false);
  voirSucces = signal(false);

  // Nombre de membres actifs du GIE
  nombreMembresActifs = computed(() =>
    this.membresService.statsMembres()?.actifs ?? 0
  );

  totalAttendu = computed(() => {
    const montant = this.form.get('montant')?.value ?? 0;
    return montant * this.nombreMembresActifs();
  });

  form: FormGroup = this.fb.group({
    libelle:   ['', Validators.required],
    montant:   [null, [Validators.required, Validators.min(1)]],
    dateDebut: ['', Validators.required],
    dateFin:   ['', Validators.required]
  });

  get libelle()   { return this.form.get('libelle')!; }
  get montant()   { return this.form.get('montant')!; }
  get dateDebut() { return this.form.get('dateDebut')!; }
  get dateFin()   { return this.form.get('dateFin')!; }

  lancerSession(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.voirConfirmation.set(true);
  }

  confirmerLancement(): void {
    this.voirConfirmation.set(false);
    this.cotisationService.creerSession(this.form.value).subscribe({
      next: () => this.voirSucces.set(true),
      error: (e) => console.error(e)
    });
  }

  voirTableauDeBord(): void {
    this.voirSucces.set(false);
    this.router.navigate(['/mon-espace']);
  }

  gererCotisations(): void {
    this.voirSucces.set(false);
    this.router.navigate(['/mon-espace/cotisations']);
  }
}
