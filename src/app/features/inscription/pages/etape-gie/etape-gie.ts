
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { InscriptionService } from '../../services/inscription.service';
import { TypeGie } from '../../models/inscription.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-etape-gie',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DecimalPipe
  ],
  templateUrl: './etape-gie.html'
})
export class EtapeGie {

  protected service = inject(InscriptionService);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Rappel de l'abonnement : même grille que la page d'accueil et la facturation
  essai = signal<{ dureeEssaiJours: number; prixMinimum: number } | null>(null);

  constructor() {
    this.http.get<{ dureeEssaiJours: number; paliers: { montant: number }[] }>(
      `${environment.API_URL}abonnements/grille/`
    ).subscribe({
      next: (g) => this.essai.set({
        dureeEssaiJours: g.dureeEssaiJours,
        prixMinimum: g.paliers[0]?.montant ?? 0,
      }),
      error: () => {}   // la mention garde un texte générique
    });
  }

  nom = '';
  region: string | null = null;
  secteur: TypeGie | null = null;
  telephone = '';

  regions = [
    'Dakar',
    'Thiès',
    'Kolda',
    'Ziguinchor',
    'Saint-Louis',
    'Diourbel',
    'Fatick'
  ];

  organisation: { label: string; value: TypeGie }[] = [
    { label: 'Association', value: 'association' },
    {
      label: 'Organisation Communautaire',
      value: 'organisation_communautaire'
    },
    { label: 'Groupement', value: 'groupement' },
    { label: 'Autre', value: 'autre' }
  ];

  continuer(form: NgForm): void {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.service.creerGie({
      nom: this.nom.trim(),
      region: this.region!,
      typeGie: this.secteur!,
      telephone: this.telephone.trim() || undefined
    }).subscribe({
      next: () => {
        this.router.navigate(['/inscription/compte']);
      }
    });
  }

  validerNom(value: string, champ: NgModel): void {
  const repetition = /([a-zà-ÿ])\1\1/i.test(value);

  const erreurs = { ...(champ.errors ?? {}) };

  if (repetition) {
    erreurs['repetition'] = true;
  } else {
    delete erreurs['repetition'];
  }

  champ.control.setErrors(
    Object.keys(erreurs).length > 0 ? erreurs : null
  );
}
}

