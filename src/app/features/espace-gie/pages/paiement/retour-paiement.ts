import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Navbar } from '../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';

type StatutRetour = 'chargement' | 'confirme' | 'en_attente' | 'echoue' | 'erreur';

@Component({
  selector: 'app-retour-paiement',
  templateUrl: './retour-paiement.html',
  imports: [Navbar, BottomNav],
})
export class RetourPaiement implements OnInit {

  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  statut    = signal<StatutRetour>('chargement');
  module    = signal<string>('');   // 'cotisation' | 'pret'
  objetId   = signal<string>('');
  token     = signal<string>('');

  private readonly BASE_URL = environment.API_URL;

  // Nouvelles vérifications en attendant le callback PayDunya (5 × 2 s)
  private static readonly ESSAIS_MAX = 5;
  private essais = 0;
  private detruit = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detruit = true);
  }

  ngOnInit(): void {
    // PayDunya renvoie le token et le type dans l'URL de retour
    // Exemple : /paiement/retour?token=abc123&type=cotisation&id=5
    const params = this.route.snapshot.queryParamMap;
    const tokenParam  = params.get('token')  ?? '';
    const typeParam   = params.get('type')   ?? '';
    const idParam     = params.get('id')     ?? '';

    this.token.set(tokenParam);
    this.module.set(typeParam);
    this.objetId.set(idParam);

    if (!tokenParam || !typeParam || !idParam) {
      this.statut.set('erreur');
      return;
    }

    // Vérifier le statut réel depuis le backend
    this._verifierStatut(typeParam, idParam);
  }

  private _verifierStatut(type: string, id: string): void {
    if (type === 'abonnement') {
      // Le backend interroge PayDunya si le paiement est encore en attente
      this.http.get<any>(`${this.BASE_URL}abonnements/paiements/${id}/`).subscribe({
        next: (paiement) => {
          const s = paiement?.statut ?? '';
          this.statut.set(s === 'valide' ? 'confirme' : s === 'en_attente' ? 'en_attente' : 'echoue');
        },
        error: () => this.statut.set('erreur')
      });
      return;
    }

    const url = type === 'cotisation'
      ? `${this.BASE_URL}cotisations/${id}/`
      : `${this.BASE_URL}prets/${id}/`;

    this.http.get<any>(url).subscribe({
      next: (objet) => {
        const s = objet?.statut ?? '';
        // Le paiement n'est confirmé qu'à réception du callback PayDunya :
        // cotisation « payée », prêt « remboursé ». Avant, l'objet reste « en cours ».
        if (s === 'paye' || s === 'rembourse') {
          this.statut.set('confirme');
        } else if (s === 'en_cours' || s === 'en_retard') {
          // PayDunya peut ramener ici avant d'avoir prévenu le backend :
          // on revérifie quelques fois avant d'afficher « en attente »
          if (this.essais < RetourPaiement.ESSAIS_MAX && !this.detruit) {
            this.essais++;
            setTimeout(() => this._verifierStatut(type, id), 2000);
          } else {
            this.statut.set('en_attente');
          }
        } else {
          this.statut.set('echoue');
        }
      },
      error: () => this.statut.set('erreur')
    });
  }

  retour(): void {
    const type = this.module();
    const id   = this.objetId();
    if (type === 'abonnement') {
      this.router.navigate(['/mon-espace/informations-gie']);
    } else if (type === 'cotisation') {
      this.router.navigate(['/mon-espace/cotisations']);
    } else if (type === 'pret' && id) {
      this.router.navigate(['/mon-espace/prets', id]);
    } else {
      this.router.navigate(['/mon-espace']);
    }
  }
}
