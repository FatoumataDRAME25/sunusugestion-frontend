import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PretService } from '../../../../../../core/services/pret.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';

type Mode = 'vue' | 'creation' | 'modification' | 'succes';

@Component({
  selector: 'app-regles-pret',
  templateUrl: './regles-pret.html',
  imports: [RouterLink, DecimalPipe, FormsModule, Navbar, BottomNav],
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
    this.service.chargerRegle().subscribe({
      next: () => {
        // Si règle existe → vue, sinon → création
        this.mode.set(this.service.regle() ? 'vue' : 'creation');
        this._remplirFormulaire();
      },
      error: () => this.mode.set('creation')
    });
  }

  ouvrirModification(): void {
    this._remplirFormulaire();
    this.mode.set('modification');
  }

  enregistrer(): void {
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
