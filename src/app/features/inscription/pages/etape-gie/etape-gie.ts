
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { InscriptionService } from '../../services/inscription.service';
import { TypeGie } from '../../models/inscription.model';

@Component({
  selector: 'app-etape-gie',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './etape-gie.html'
})
export class EtapeGie {

  protected service = inject(InscriptionService);
  private router = inject(Router);

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

