// features/inscription/pages/etape-gie/etape-gie.ts
import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InscriptionService } from '../../services/inscription.service';
import { TypeGie } from '../../models/inscription.model';

@Component({
  selector: 'app-etape-gie',
  imports: [RouterLink,FormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './etape-gie.html'
})
export class EtapeGie {

  protected service = inject(InscriptionService);
  private router = inject(Router);

  nom = signal('');
  region = signal<string | null>(null);
  secteur = signal<TypeGie | null>(null);
  telephone = signal('');

  regions = ['Dakar', 'Thiès', 'Kolda', 'Ziguinchor', 'Saint-Louis', 'Diourbel', 'Fatick'];

  organisation: { label: string; value: TypeGie }[] = [
    { label: 'Association', value: 'association' },
    { label: 'Organisation Communautaire', value: 'organisation_communautaire' },
    { label: 'Groupement', value: 'groupement' },
    { label: 'Autre', value: 'autre' }
  ];

  continuer(): void {
    this.service
      .creerGie({
        nom: this.nom(),
        region: this.region()!,
        typeGie: this.secteur()!,
        telephone: this.telephone() || undefined
      })
      .subscribe({
        next: () => this.router.navigate(['/inscription/compte'])
      });
  }
}
