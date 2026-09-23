import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActiviteService } from '../../../../../../core/services/activite.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { TypeActivite, TYPES_ACTIVITE, Activite } from '../../../../../../core/models/activite.model';

@Component({
  selector: 'app-planifier-activite',
  templateUrl: './planifier-activite.html',
  imports: [RouterLink, FormsModule, Navbar, BottomNav],
})
export class PlanifierActivite implements OnInit {

  protected service = inject(ActiviteService);
  private router = inject(Router);

  // Champs formulaire
  titre = signal('');
  typeActivite = signal<TypeActivite | ''>('');
  dateActivite = signal('');
  heureActivite = signal('');
  lieu = signal('');
  description = signal('');

  // Validation
  erreurs = signal<Record<string, string>>({});
  soumis = signal(false);

  // Mode : 'formulaire' | 'succes'
  mode = signal<'formulaire' | 'succes'>('formulaire');

  // Activité créée (pour afficher dans l'écran succès)
  activiteCreee = signal<Activite | null>(null);

  readonly typesActivite = TYPES_ACTIVITE;

  // Mode édition (modification d'une activité existante)
  activiteAModifier = signal<Activite | null>(null);

  ngOnInit(): void {
    this.service.errorMessage.set(null);
    // Si une activité est sélectionnée, on pré-remplit le formulaire
    const existante = this.service.activiteSelectionnee();
    if (existante && window.history.state?.modifier) {
      this.activiteAModifier.set(existante);
      this.titre.set(existante.titre);
      this.typeActivite.set(existante.typeActivite);
      this.lieu.set(existante.lieu);
      this.description.set('');
      // Décompose dateActivite ISO en date + heure
      const dt = new Date(existante.dateActivite);
      this.dateActivite.set(dt.toISOString().split('T')[0]);
      this.heureActivite.set(dt.toTimeString().substring(0, 5));
    }
  }

  valider(): boolean {
    const errs: Record<string, string> = {};
    if (!this.titre().trim()) errs['titre'] = 'Le titre est obligatoire';
    if (!this.typeActivite()) errs['type'] = 'Le type est obligatoire';
    if (!this.dateActivite()) errs['date'] = 'La date et l\'heure sont obligatoires';
    else if (!this.heureActivite()) errs['date'] = 'La date et l\'heure sont obligatoires';
    if (!this.lieu().trim()) errs['lieu'] = 'Le lieu est obligatoire';
    this.erreurs.set(errs);
    return Object.keys(errs).length === 0;
  }

  planifier(): void {
    this.soumis.set(true);
    if (!this.valider()) return;

    // Combine date + heure en ISO
    const dateISO = `${this.dateActivite()}T${this.heureActivite()}:00`;

    const body = {
      titre: this.titre().trim(),
      typeActivite: this.typeActivite() as TypeActivite,
      dateActivite: dateISO,
      lieu: this.lieu().trim(),
    };

    const aModifier = this.activiteAModifier();

    if (aModifier) {
      this.service.modifierActivite(aModifier.id, body).subscribe({
        next: (a) => {
          this.activiteCreee.set(a);
          this.mode.set('succes');
        }
      });
    } else {
      this.service.creerActivite(body).subscribe({
        next: (a) => {
          this.activiteCreee.set(a);
          this.mode.set('succes');
        }
      });
    }
  }

  retourListe(): void {
    this.router.navigate(['/mon-espace/activites']);
  }

  planifierUneAutre(): void {
    this.titre.set('');
    this.typeActivite.set('');
    this.dateActivite.set('');
    this.heureActivite.set('');
    this.lieu.set('');
    this.description.set('');
    this.erreurs.set({});
    this.soumis.set(false);
    this.mode.set('formulaire');
    this.activiteCreee.set(null);
    this.activiteAModifier.set(null);
    this.service.errorMessage.set(null);
  }

  estEnErreur(champ: string): boolean {
    return this.soumis() && !!this.erreurs()[champ];
  }
}
