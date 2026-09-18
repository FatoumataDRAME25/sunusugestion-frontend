import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MembresService } from '../../../../../../core/services/membres.service';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';

@Component({
  selector: 'app-liste-membre',
  imports: [RouterLink, FormsModule, BottomNav, InitialesPipe],
  styleUrl: './liste-membre.css',
  templateUrl: './liste-membre.html'
})
export class ListeMembre implements OnInit {

  protected service = inject(MembresService);

  optionsStatut : { label: string; value: 'en_attente' | 'actif' | 'inactif' | null }[] = [
    { label: 'Tous', value: null },
    { label: 'Actifs', value: 'actif' },
    { label: 'Inactifs', value: 'inactif' },
    { label: 'En attente', value: 'en_attente' }
  ];

  // Pour le sélecteur de statut affiché dans l'UI
  statutActuel = 'Tous';

  ngOnInit(): void {
    this.service.chargerMembres().subscribe(
      {
        next: () =>{
          console.log('listes affichees');

        },
        error: (err) =>{
          console.log('listes non affichees:', err);

        }
      }
    );
  }

  changerStatut(valeur: 'en_attente' | 'actif' | 'inactif' | null, label: string): void {
    this.service.filtreStatut.set(valeur);
    this.statutActuel = label;
  }
}
