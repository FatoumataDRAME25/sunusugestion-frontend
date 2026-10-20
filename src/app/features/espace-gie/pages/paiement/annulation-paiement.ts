import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';

/**
 * Page affichée quand l'utilisateur annule son paiement sur PayDunya.
 * Exemple : /paiement/annule?type=cotisation&id=5&token=abc123
 * Aucun appel au serveur : un paiement annulé n'a rien débité.
 */
@Component({
  selector: 'app-annulation-paiement',
  templateUrl: './annulation-paiement.html',
  imports: [Navbar, BottomNav],
})
export class AnnulationPaiement implements OnInit {

  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  module  = signal<string>('');   // 'cotisation' | 'pret' | 'abonnement'
  objetId = signal<string>('');

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.module.set(params.get('type') ?? '');
    this.objetId.set(params.get('id') ?? '');
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
