import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActiviteService } from '../../../../../../core/services/activite.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { TYPES_ACTIVITE } from '../../../../../../core/models/activite.model';

@Component({
  selector: 'app-detail-activite',
  templateUrl: './detail-activite.html',
  imports: [RouterLink, DatePipe, FormsModule, Navbar, BottomNav],
})
export class DetailActivite implements OnInit {

  protected service = inject(ActiviteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Modal démarrer
  modalDemarrerVisible = signal(false);
  ordreDuJour = signal('');

  // Modal terminer
  modalTerminerVisible = signal(false);
  compteRendu = signal('');
  erreurCompteRendu = signal(false);

  // Modal annuler — uniquement pour statut planifiee
  modalAnnulerVisible = signal(false);

  activite = this.service.activiteSelectionnee;

  estPlanifiee = computed(() => this.service.activiteSelectionnee()?.statut === 'planifiee');
  estEnCours   = computed(() => this.service.activiteSelectionnee()?.statut === 'en_cours');
  estTerminee  = computed(() => this.service.activiteSelectionnee()?.statut === 'terminee');
  estAnnulee   = computed(() => this.service.activiteSelectionnee()?.statut === 'annulee');

  readonly typesActivite = TYPES_ACTIVITE;

  labelType(type: string): string {
    return this.typesActivite.find(t => t.value === type)?.label ?? type;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.errorMessage.set(null);
    // Réinitialise le signal pour forcer le rechargement
    this.service.activiteSelectionnee.set(null);
    this.service.getActivite(id).subscribe();
  }

  // ─── DÉMARRER ────────────────────────────────────────────
  confirmerDemarrer(): void {
    const id = this.activite()?.id;
    if (!id) return;
    const body = this.ordreDuJour().trim()
      ? { ordreDuJour: this.ordreDuJour().trim() }
      : {};
    this.service.demarrerActivite(id, body).subscribe({
      next: () => {
        this.modalDemarrerVisible.set(false);
        this.ordreDuJour.set('');
      }
    });
  }

  // ─── TERMINER ────────────────────────────────────────────
  confirmerTerminer(): void {
    if (!this.compteRendu().trim()) {
      this.erreurCompteRendu.set(true);
      return;
    }
    const id = this.activite()?.id;
    if (!id) return;
    this.service.terminerActivite(id, { compteRendu: this.compteRendu().trim() }).subscribe({
      next: () => {
        this.modalTerminerVisible.set(false);
        this.compteRendu.set('');
        this.erreurCompteRendu.set(false);
      }
    });
  }

  // ─── ANNULER ─────────────────────────────────────────────
  confirmerAnnuler(): void {
    const id = this.activite()?.id;
    if (!id) return;
    this.service.annulerActivite(id).subscribe({
      next: () => this.modalAnnulerVisible.set(false)
    });
  }

  // ─── MODIFIER ────────────────────────────────────────────
  naviguerModifier(): void {
    this.router.navigate(['/mon-espace/activites/planifier'], {
      state: { modifier: true }
    });
  }

  // ─── PRÉSENCES ───────────────────────────────────────────
  naviguerPresences(): void {
    const id = this.activite()?.id;
    if (!id) return;
    this.router.navigate(['/mon-espace/activites', id, 'presences']);
  }

  retourListe(): void {
    this.router.navigate(['/mon-espace/activites']);
  }
}
