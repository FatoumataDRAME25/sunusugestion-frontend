// features/inscription/pages/etape-gie/etape-gie.ts
import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SecteurGie } from '../../models/inscription.model';
import { InscriptionService } from '../../services/inscription.service';

@Component({
  selector: 'app-etape-gie',
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './etape-gie.html'
})
export class EtapeGie {
  
  protected service = inject(InscriptionService);
  private router = inject(Router);

  nom = signal('');
  region = signal<string | null>(null);
  secteur = signal<SecteurGie | null>(null);
  telephone = signal('');

  regions = ['Dakar', 'Thiès', 'Kolda', 'Ziguinchor', 'Saint-Louis', 'Diourbel', 'Fatick'];

  secteurs: { label: string; value: SecteurGie }[] = [
    { label: 'Agriculture', value: 'agriculture' },
    { label: 'Commerce', value: 'commerce' },
    { label: 'Pêche', value: 'peche' },
    { label: 'Artisanat', value: 'artisanat' },
    { label: 'Services', value: 'services' },
    { label: 'Autre', value: 'autre' }
  ];

  continuer(): void {
    this.service
      .creerGie({
        nom: this.nom(),
        region: this.region()!,
        secteur: this.secteur()!,
        telephone: this.telephone() || undefined
      })
      .subscribe({
        next: () => this.router.navigate(['/inscription/compte'])
      });
  }
}
