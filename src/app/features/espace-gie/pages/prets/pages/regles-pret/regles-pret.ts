import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PretService } from '../../../../../../core/services/pret.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';

type Mode = 'vue' | 'creation' | 'modification' | 'succes';

@Component({
  selector: 'app-regles-pret',
  templateUrl: './regles-pret.html',
  imports: [RouterLink, DecimalPipe, FormsModule, Navbar, BottomNav, GieSidebar],
})
export class ReglesPret implements OnInit {

  protected service = inject(PretService);
  protected authService = inject(AuthService);
  protected router = inject(Router);

  estPresident = () => this.authService.currentUser()?.role === 'president';

  mode = signal<Mode>('vue');

  // Champs formulaire
  montantMax = signal('');
  dureeMax = signal(12);
  nbSimultanes = signal(1);
  cotisationObligatoire = signal(true);

  ngOnInit(): void {
    this.service.errorMessage.set(null);
    // Sans règle, seul le président voit le formulaire de création ;
    // les autres membres voient « Aucune règle configurée ».
    const sansRegle = () => this.mode.set(this.estPresident() ? 'creation' : 'vue');

    this.service.chargerRegle().subscribe({
      next: () => {
        if (this.service.regle()) {
          this.mode.set('vue');
        } else {
          sansRegle();
        }
        this._remplirFormulaire();
      },
      error: () => sansRegle()
    });
  }

  ouvrirModification(): void {
    this._remplirFormulaire();
    this.mode.set('modification');
  }

  readonly DUREE_MAX = 120;

  enregistrer(): void {
    // Mêmes limites que le serveur, pour prévenir avant l'envoi
    if (!(+this.montantMax() > 0)) {
      this.service.errorMessage.set('Le montant maximum doit être supérieur à 0.');
      return;
    }
    if (!(this.dureeMax() >= 1 && this.dureeMax() <= this.DUREE_MAX)) {
      this.service.errorMessage.set(`La durée maximale doit être comprise entre 1 et ${this.DUREE_MAX} mois.`);
      return;
    }

    const body = {
      montantMax: this.montantMax(),
      dureeMaxMois: this.dureeMax(),
      nombrePretsSimultanes: this.nbSimultanes(),
      cotisationAJourObligatoire: this.cotisationObligatoire(),
    };

    const obs$ = this.service.regle()
      ? this.service.modifierRegle(body)
      : this.service.creerRegle(body);

    obs$.subscribe({
      next: () => this.mode.set('succes')
    });
  }

  retourVue(): void {
    this.mode.set('vue');
  }

  incrementer(): void { this.nbSimultanes.set(this.nbSimultanes() + 1); }
  decrementer(): void { if (this.nbSimultanes() > 1) this.nbSimultanes.set(this.nbSimultanes() - 1); }

  private _remplirFormulaire(): void {
    const r = this.service.regle();
    if (!r) return;
    this.montantMax.set(r.montantMax);
    this.dureeMax.set(r.dureeMaxMois);
    this.nbSimultanes.set(r.nombrePretsSimultanes);
    this.cotisationObligatoire.set(r.cotisationAJourObligatoire);
  }
}
