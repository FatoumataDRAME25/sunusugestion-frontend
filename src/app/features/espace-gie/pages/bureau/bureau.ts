import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { MembresService } from '../../../../core/services/membres.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  FonctionBureau,
  LIBELLES_FONCTIONS,
  LIBELLES_ROLES,
  Membre,
  ReponseActionMembre,
  RoleMembre,
} from '../../../../core/models/membre.model';
import { GieSidebar } from '../../../../shared/ui/gie-sidebar/gie-sidebar';
import { Navbar } from '../../../../shared/ui/navbar/navbar';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';
import { ConfirmationModal } from '../../../../shared/ui/confirmation-modal/confirmation-modal';

type Poste =
  | { type: 'role'; cle: RoleMembre }
  | { type: 'fonction'; cle: FonctionBureau };

@Component({
  selector: 'app-bureau',
  imports: [NgTemplateOutlet, FormsModule, RouterLink, GieSidebar, Navbar, InitialesPipe, ConfirmationModal],
  templateUrl: './bureau.html',
})
export class Bureau implements OnInit {

  protected service = inject(MembresService);
  protected authService = inject(AuthService);

  readonly libellesRoles = LIBELLES_ROLES;
  readonly libellesFonctions = LIBELLES_FONCTIONS;

  // Postes donnant des droits (un seul titulaire chacun)
  readonly postesTitulaires: { cle: RoleMembre; icone: string }[] = [
    { cle: 'president', icone: 'pi-star' },
    { cle: 'tresorier', icone: 'pi-wallet' },
    { cle: 'secretaire', icone: 'pi-pencil' },
  ];

  // Adjoints : titres sans droit supplémentaire
  readonly postesAdjoints: { cle: FonctionBureau; icone: string }[] = [
    { cle: 'vice_president', icone: 'pi-star' },
    { cle: 'tresorier_adjoint', icone: 'pi-wallet' },
    { cle: 'secretaire_adjoint', icone: 'pi-pencil' },
  ];

  readonly rolesApresPassation: RoleMembre[] = ['membre', 'tresorier', 'secretaire'];

  estPresident = computed(() => this.authService.currentUser()?.role === 'president');

  chargement = signal(true);
  erreurChargement = signal<string | null>(null);
  succes = signal<string | null>(null);

  // ── Modal d'attribution d'un poste ──
  posteEnEdition = signal<Poste | null>(null);
  candidatId = signal<number | null>(null);
  roleAncienPresident = signal<RoleMembre>('membre');
  enregistrement = signal(false);
  erreurEdition = signal<string | null>(null);

  // ── Confirmation « libérer le poste » ──
  posteALiberer = signal<Poste | null>(null);
  liberation = signal(false);
  erreurLiberation = signal<string | null>(null);

  ngOnInit(): void {
    this.service.chargerMembres().subscribe({
      next: () => this.chargement.set(false),
      error: (err) => {
        this.erreurChargement.set(
          this.service.messageErreur(err, 'Impossible de charger le bureau.')
        );
        this.chargement.set(false);
      }
    });
  }

  titulaire(poste: Poste): Membre | undefined {
    return this.service.membres().find((m) =>
      poste.type === 'role' ? m.role === poste.cle : m.fonctionBureau === poste.cle
    );
  }

  libelle(poste: Poste): string {
    return poste.type === 'role'
      ? this.libellesRoles[poste.cle]
      : this.libellesFonctions[poste.cle];
  }

  // Membres pouvant recevoir le poste : comptes actifs, hors titulaire actuel.
  // Les fonctions adjointes sont réservées aux membres simples.
  candidats = computed(() => {
    const poste = this.posteEnEdition();
    if (!poste) return [];

    const titulaire = this.titulaire(poste);
    const moi = this.authService.currentUser()?.id;

    return this.service.membres().filter((m) =>
      m.statut === 'actif'
      && m.id !== titulaire?.id
      && !(poste.type === 'role' && poste.cle === 'president' && m.id === moi)
      && !(poste.type === 'fonction' && m.role !== 'membre')
    );
  });

  // ── Attribution ──────────────────────────────────────────

  ouvrirEdition(poste: Poste): void {
    this.posteEnEdition.set(poste);
    this.candidatId.set(null);
    this.roleAncienPresident.set('membre');
    this.erreurEdition.set(null);
    this.succes.set(null);
  }

  @HostListener('document:keydown.escape')
  fermerEdition(): void {
    if (!this.enregistrement()) {
      this.posteEnEdition.set(null);
    }
  }

  enregistrer(): void {
    const poste = this.posteEnEdition();
    const candidat = this.service.membres().find((m) => m.id === this.candidatId());

    if (!poste || !candidat) {
      this.erreurEdition.set('Choisissez un membre.');
      return;
    }

    this.enregistrement.set(true);
    this.erreurEdition.set(null);

    let operation: Observable<ReponseActionMembre>;

    if (poste.type === 'role' && poste.cle === 'president') {
      // Passation : échange atomique côté serveur
      operation = this.service.modifierRole(candidat.id, 'president', this.roleAncienPresident());
    } else {
      operation = this.attribuerPosteOccupe(poste, candidat);
    }

    operation.subscribe({
      next: (reponse) => {
        if (reponse.ancienPresident) {
          // L'utilisateur connecté n'est plus président : mise à jour immédiate
          this.authService.updateProfil({ role: reponse.ancienPresident.role });
        }
        this.succes.set(reponse.message);
        this.enregistrement.set(false);
        this.posteEnEdition.set(null);
      },
      error: (err) => {
        this.erreurEdition.set(this.service.messageErreur(err, "Le poste n'a pas pu être attribué."));
        this.enregistrement.set(false);
        // Resynchronise l'affichage avec le serveur
        this.service.chargerMembres().subscribe();
      }
    });
  }

  /**
   * Un poste ne peut avoir qu'un titulaire : s'il est occupé, l'ancien
   * titulaire le libère d'abord, puis le nouveau le reçoit. Si la seconde
   * étape échoue, l'ancien titulaire retrouve son poste.
   */
  private attribuerPosteOccupe(poste: Poste, candidat: Membre): Observable<ReponseActionMembre> {
    const ancien = this.titulaire(poste);

    const attribuer = (id: number) => poste.type === 'role'
      ? this.service.modifierRole(id, poste.cle)
      : this.service.modifierFonction(id, poste.cle);

    const liberer = (id: number) => poste.type === 'role'
      ? this.service.modifierRole(id, 'membre')
      : this.service.modifierFonction(id, '');

    if (!ancien) {
      return attribuer(candidat.id);
    }

    return liberer(ancien.id).pipe(
      switchMap(() => attribuer(candidat.id).pipe(
        catchError((err) => attribuer(ancien.id).pipe(
          catchError(() => of(null)),
          switchMap(() => throwError(() => err))
        ))
      ))
    );
  }

  // ── Libération d'un poste ────────────────────────────────

  demanderLiberation(poste: Poste): void {
    this.erreurLiberation.set(null);
    this.succes.set(null);
    this.posteALiberer.set(poste);
  }

  confirmerLiberation(): void {
    const poste = this.posteALiberer();
    const titulaire = poste ? this.titulaire(poste) : undefined;
    if (!poste || !titulaire) return;

    this.liberation.set(true);
    this.erreurLiberation.set(null);

    const operation = poste.type === 'role'
      ? this.service.modifierRole(titulaire.id, 'membre')
      : this.service.modifierFonction(titulaire.id, '');

    operation.subscribe({
      next: () => {
        this.succes.set(`Le poste de ${this.libelle(poste).toLowerCase()} est maintenant vacant.`);
        this.liberation.set(false);
        this.posteALiberer.set(null);
      },
      error: (err) => {
        this.erreurLiberation.set(this.service.messageErreur(err, "Le poste n'a pas pu être libéré."));
        this.liberation.set(false);
      }
    });
  }

  messageLiberation(): string {
    const poste = this.posteALiberer();
    const titulaire = poste ? this.titulaire(poste) : undefined;
    if (!poste || !titulaire) return '';

    return poste.type === 'role'
      ? `${titulaire.prenom} ${titulaire.nom} redeviendra membre et perdra les droits de ${this.libelle(poste).toLowerCase()}.`
      : `${titulaire.prenom} ${titulaire.nom} ne sera plus ${this.libelle(poste).toLowerCase()}.`;
  }
}
