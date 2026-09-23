import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ActiviteService } from '../../../../../../core/services/activite.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { MembrePresence } from '../../../../../../core/models/activite.model';

@Component({
  selector: 'app-presences-activite',
  templateUrl: './presences-activite.html',
  imports: [ DatePipe, InitialesPipe, Navbar, BottomNav],
})
export class PresencesActivite implements OnInit {

  protected service = inject(ActiviteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activiteId = signal(0);

  // Copie locale des membres avec leur statut (modifiable)
  membres = signal<MembrePresence[]>([]);

  mode = signal<'liste' | 'succes'>('liste');

  activite = computed(() => this.service.activiteSelectionnee());

  // Stats calculées
  nbPresents = computed(() => this.membres().filter(m => m.statut === 'present').length);
  nbAbsents  = computed(() => this.membres().filter(m => m.statut === 'absent').length);
  nbTotal    = computed(() => this.membres().length);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.activiteId.set(id);
    this.service.errorMessage.set(null);

    // Charger l'activité si pas déjà chargée
    if (!this.service.activiteSelectionnee() || this.service.activiteSelectionnee()?.id !== id) {
      this.service.getActivite(id).subscribe();
    }

    // Charger les membres avec leurs présences
    this.service.getMembresActivite(id).subscribe({
      next: (liste) => this.membres.set(liste)
    });
  }

  setStatut(membre: MembrePresence, statut: 'present' | 'absent'): void {
    this.membres.set(
      this.membres().map(m =>
        m.id === membre.id
          ? { ...m, statut: m.statut === statut ? null : statut }
          : m
      )
    );
  }

  enregistrer(): void {
    const id = this.activiteId();

    // N'envoyer que les membres qui ont un statut défini
    const presences = this.membres()
      .filter(m => m.statut !== null)
      .map(m => ({ utilisateur: m.id, statut: m.statut as 'present' | 'absent' }));

    this.service.enregistrerPresences(id, { presences }).subscribe({
      next: () => this.mode.set('succes')
    });
  }

  retourActivite(): void {
    this.router.navigate(['/mon-espace/activites', this.activiteId()]);
  }
}
