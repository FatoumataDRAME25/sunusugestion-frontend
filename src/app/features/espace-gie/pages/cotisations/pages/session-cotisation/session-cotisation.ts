import { Component, computed, inject, signal, OnInit } from '@angular/core';
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
export class SessionCotisation implements OnInit {
  cotisationService = inject(CotisationService);
  private membresService = inject(MembresService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  voirConfirmation = signal(false);
  voirSucces = signal(false);
  erreurDates = signal<string | null>(null);

  // Nombre de membres actifs du GIE
  nombreMembresActifs = computed(() =>
    this.membresService.statsMembres()?.actifs ?? 0
  );

  montantSaisi = signal<number>(0);

  totalAttendu = computed(() => {
    return this.montantSaisi() * this.nombreMembresActifs();
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

  ngOnInit(): void {
    // Charge les stats membres si elles ne sont pas encore disponibles
    if (!this.membresService.statsMembres()) {
      this.membresService.chargerMembres().subscribe();
    }

    // Synchronise le signal montantSaisi avec le champ du formulaire
    this.form.get('montant')?.valueChanges.subscribe(val => {
      this.montantSaisi.set(val ?? 0);
    });
  }

  lancerSession(): void {
    // 1. Vérification des champs obligatoires (libelle, montant, dates requises)
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erreurDates.set(null);
      return;
    }

    // 2. Validation des règles métier sur les dates
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);

    const dateDebut = new Date(this.form.value.dateDebut);
    const dateFin   = new Date(this.form.value.dateFin);

    if (dateDebut < aujourd_hui) {
      this.erreurDates.set("La date de début ne peut pas être dans le passé.");
      return;
    }
    if (dateFin < aujourd_hui) {
      this.erreurDates.set("La date de fin ne peut pas être dans le passé.");
      return;
    }
    if (dateFin < dateDebut) {
      this.erreurDates.set("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }

    this.erreurDates.set(null);
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
