import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MembresService } from '../../../../../../core/services/membres.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import {
  CotisationMembre,
  LIBELLES_FONCTIONS,
  LIBELLES_ROLES,
  Membre,
  ReponseCotisationsMembre,
} from '../../../../../../core/models/membre.model';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { InitialesPipe } from '../../../../../../shared/pipes/initiales-pipe';
import { ConfirmationModal } from '../../../../../../shared/ui/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-fiche-membre',
  imports: [RouterLink, DatePipe, DecimalPipe, GieSidebar, Navbar, InitialesPipe, ConfirmationModal],
  templateUrl: './fiche-membre.html',
})
export class FicheMembre implements OnInit {

  private route = inject(ActivatedRoute);
  protected service = inject(MembresService);
  protected authService = inject(AuthService);

  readonly libellesRoles = LIBELLES_ROLES;
  readonly libellesFonctions = LIBELLES_FONCTIONS;

  membre = signal<Membre | null>(null);
  cotisations = signal<ReponseCotisationsMembre | null>(null);
  chargement = signal(true);
  erreur = signal<string | null>(null);

  // Confirmation Activer / Désactiver
  confirmationOuverte = signal(false);
  actionEnCours = signal(false);
  erreurAction = signal<string | null>(null);
  succes = signal<string | null>(null);

  voitBoutonStatut = computed(() =>
    this.service.voitBoutonStatut(this.authService.currentUser())
  );

  raisonStatutImpossible = computed(() => {
    const membre = this.membre();
    return membre ? this.service.raisonStatutImpossible(membre, this.authService.currentUser()) : null;
  });

  // ── Invitation (comptes en attente) ──
  invitationEnCours = signal(false);
  erreurInvitation = signal<string | null>(null);

  peutRenvoyerInvitation = computed(() => {
    const membre = this.membre();
    return !!membre && this.service.peutRenvoyerInvitation(membre, this.authService.currentUser());
  });

  invitationExpiree = computed(() => {
    const expiration = this.membre()?.invitationExpiration;
    return !!expiration && new Date(expiration).getTime() <= Date.now();
  });

  renvoyerInvitation(): void {
    const membre = this.membre();
    if (!membre) return;

    this.invitationEnCours.set(true);
    this.erreurInvitation.set(null);
    this.succes.set(null);

    this.service.renvoyerInvitation(membre).subscribe({
      next: (reponse) => {
        this.membre.set(reponse.membre);
        this.succes.set(reponse.message);
        this.invitationEnCours.set(false);
      },
      error: (err) => {
        this.erreurInvitation.set(this.service.messageErreur(err, "L'invitation n'a pas pu être renvoyée."));
        this.invitationEnCours.set(false);
      }
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.erreur.set('Membre introuvable.');
      this.chargement.set(false);
      return;
    }

    forkJoin({
      membre: this.service.getMembre(id),
      cotisations: this.service.getCotisationsMembre(id),
    }).subscribe({
      next: ({ membre, cotisations }) => {
        this.membre.set(membre);
        this.cotisations.set(cotisations);
        this.chargement.set(false);
      },
      error: (err) => {
        this.erreur.set(
          err?.status === 404
            ? 'Membre introuvable.'
            : this.service.messageErreur(err, 'Impossible de charger la fiche du membre.')
        );
        this.chargement.set(false);
      }
    });
  }

  libelleStatutCotisation(statut: CotisationMembre['statut']): string {
    return { paye: 'Payée', en_cours: 'En cours', en_retard: 'En retard' }[statut];
  }

  classeStatutCotisation(statut: CotisationMembre['statut']): string {
    return {
      paye: 'bg-[#2E7D5B]/10 text-[#2E7D5B]',
      en_cours: 'bg-[#1E3A5F]/10 text-[#1E3A5F]',
      en_retard: 'bg-[#C1654A]/10 text-[#C1654A]',
    }[statut];
  }

  libelleModePaiement(mode: CotisationMembre['modePaiement']): string {
    if (!mode) return '—';
    return { especes: 'Espèces', wave: 'Wave', orange_money: 'Orange Money' }[mode];
  }

  ouvrirConfirmation(): void {
    this.erreurAction.set(null);
    this.succes.set(null);
    this.confirmationOuverte.set(true);
  }

  confirmerChangementStatut(): void {
    const membre = this.membre();
    if (!membre) return;

    this.actionEnCours.set(true);
    this.erreurAction.set(null);

    this.service.changerStatutCompte(membre).subscribe({
      next: (reponse) => {
        this.membre.set(reponse.membre);
        this.succes.set(reponse.message);
        this.actionEnCours.set(false);
        this.confirmationOuverte.set(false);
      },
      error: (err) => {
        this.erreurAction.set(this.service.messageErreur(err, 'Action impossible pour le moment.'));
        this.actionEnCours.set(false);
      }
    });
  }
}
