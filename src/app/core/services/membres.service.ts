import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AjouterMembreRequest,
  FonctionBureau,
  Membre,
  ReponseActionMembre,
  ReponseCotisationsMembre,
  RoleMembre,
  MembreExcel,
  MembreImporte,
  ReponseAnalyseExcel,
  ReponseImport,
  ReponseMembres
} from '../models/membre.model';
import { OcrService } from './ocr.service';
import { PersonExtraite, ProcessDocumentResponse } from '../models/ocr.model';

@Injectable({ providedIn: 'root' })
export class MembresService {


  private http = inject(HttpClient);
  private ocrService = inject(OcrService);
  private readonly BASE_URL = environment.API_URL;

  // Résultat brut OCR (utilisé pour affichage du texte brut si besoin)
  ocrResultBrut = signal<ProcessDocumentResponse | null>(null);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);


  // Liste des membres et filtres
membres = signal<Membre[]>([]);
statsMembres = signal<{ total: number; actifs: number; inactifs: number; enAttente: number } | null>(null);
termeRecherche = signal('');
filtreStatut = signal<'actif' | 'inactif' | 'en_attente' | null>(null);

  // Résultat de l'analyse Excel — partagé entre la page import et la vérification
  membresAnalyses = signal<MembreExcel[]>([]);
  statsAnalyse = signal<{ total: number; valides: number; erreurs: number } | null>(null);

  // Stocke le nom du dernier membre ajouté manuellement (pour le modal succès)
  dernierMembreAjoute = signal<{ prenom: string; nom: string } | null>(null);

  // Nombre de membres importés via Excel (pour le modal succès)
  nombreMembresImportes = signal<number>(0);

  // Membres importés avec leurs tokens d'invitation (pour l'envoi WhatsApp)
  membresImportesAvecToken = signal<MembreImporte[]>([]);

    // --- Ajout manuel ---
  ajouterMembre(donnees: AjouterMembreRequest): Observable<any> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<any>(`${this.BASE_URL}membres/membres/ajouter/`, donnees).pipe(
      tap((reponse) => {
        // On enregistre simplement les infos pour le modal de succès
        this.dernierMembreAjoute.set({ prenom: donnees.prenom, nom: donnees.nom });
        this.isLoading.set(false);
        // Le composant utilise le jeton d'invitation de la réponse pour
        // préparer le message d'invitation envoyé au membre.
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }



  // --- Import Excel : étape 1, analyse ---
  analyserExcel(fichier: File): Observable<ReponseAnalyseExcel> {
    this.isLoading.set(true);
    this.errorMessage.set(null);


    const formData = new FormData();
    formData.append('fichier', fichier);

    return this.http.post<ReponseAnalyseExcel>(
      `${this.BASE_URL}membres/membres/analyser-excel/`,
      formData
    ).pipe(
        tap((reponse) => {
          // On fusionne valides et invalides avec un champ statut pour l'affichage
          const valides = reponse.membresValides.map(m => ({ ...m, statut: 'valide' as const }));
          const invalides = reponse.membresInvalides.map(m => ({ ...m, statut: 'erreur' as const }));

          this.membresAnalyses.set([...valides, ...invalides]);
          this.statsAnalyse.set({
            total: reponse.totalValides + reponse.totalInvalides,
            valides: reponse.totalValides,
            erreurs: reponse.totalInvalides
          });
          this.isLoading.set(false);
        }),
        catchError((err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail ?? 'Fichier invalide');
          return throwError(() => err);
        })
);

  }

  // --- Import Excel : étape 2, import définitif (seulement les valides) ---
  importerMembres(): Observable<ReponseImport> {
  this.isLoading.set(true);
  this.errorMessage.set(null);

  // On retire les champs ajoutés côté Angular (statut, ligne)
  // Le backend attend seulement : prenom, nom, telephone, role
  const membresValides = this.membresAnalyses()
    .filter(m => m.statut === 'valide')
    .map(({ statut, erreurs, ...donnees }) => ({
        prenom: donnees.prenom,
        nom: donnees.nom,
        telephone: donnees.telephone,
        role: donnees.role
      }));

  return this.http.post<ReponseImport>(
    `${this.BASE_URL}membres/membres/importer/`,
    { membres:membresValides }
  ).pipe(
    tap((reponse) => {
      const nb = reponse.membresImportes?.length ?? membresValides.length;
      this.nombreMembresImportes.set(nb);
      this.membresImportesAvecToken.set(reponse.membresImportes ?? []);
      this.isLoading.set(false);
    }),
    catchError((err) => {
      console.error("Erreur lors de l'import des membres", err);
      this.isLoading.set(false);
      this.errorMessage.set(
        err?.error?.erreur ??
        err?.error?.detail ??
        err?.error?.message ??
        err?.message ??
        "Erreur lors de l'import"
      );
      return throwError(() => err);
    })
  );
}

  // Remet à zéro les données Excel entre deux imports
  reinitialiserExcel(): void {
    this.membresAnalyses.set([]);
    this.statsAnalyse.set(null);
    this.errorMessage.set(null);
  }


// Membres filtrés — computed se recalcule automatiquement quand les signals changent
// À importer : computed depuis @angular/core
membresFiltres = computed(() => {
  const terme = this.termeRecherche().toLowerCase();
  const statut = this.filtreStatut();

  return this.membres().filter(m => {
    const correspondNom = (m.prenom + ' ' + m.nom).toLowerCase().includes(terme);
    const correspondStatut = !statut || m.statut === statut;
    return correspondNom && correspondStatut;
  });
});

// ─── Fiche membre et actions du président ──────────────────────────────────

/** Détail d'un membre du GIE. GET /api/membres/membres/<id>/ */
getMembre(id: number): Observable<Membre> {
  return this.http.get<Membre>(`${this.BASE_URL}membres/membres/${id}/`);
}

/** Cotisations d'un membre du GIE. GET /api/membres/membres/<id>/cotisations/ */
getCotisationsMembre(id: number): Observable<ReponseCotisationsMembre> {
  return this.http.get<ReponseCotisationsMembre>(
    `${this.BASE_URL}membres/membres/${id}/cotisations/`
  );
}

/** Suspend (désactive) ou réactive le compte d'un membre. Président uniquement. */
changerStatutCompte(membre: Membre): Observable<ReponseActionMembre> {
  const action = membre.statut === 'actif' ? 'suspendre' : 'reactiver';
  return this.http.patch<ReponseActionMembre>(
    `${this.BASE_URL}membres/membres/${membre.id}/${action}/`, {}
  ).pipe(tap((reponse) => this.mettreAJourMembre(reponse.membre)));
}

/**
 * Change le rôle d'un membre. Pour transmettre la présidence, indiquer
 * le nouveau rôle du président actuel (roleAncienPresident).
 */
modifierRole(id: number, role: RoleMembre, roleAncienPresident?: RoleMembre): Observable<ReponseActionMembre> {
  const corps: Record<string, string> = { role };
  if (roleAncienPresident) {
    corps['roleAncienPresident'] = roleAncienPresident;
  }
  return this.http.patch<ReponseActionMembre>(
    `${this.BASE_URL}membres/membres/${id}/modifier-role/`, corps
  ).pipe(tap((reponse) => {
    this.mettreAJourMembre(reponse.membre);
    if (reponse.ancienPresident) {
      this.mettreAJourMembre(reponse.ancienPresident);
    }
  }));
}

/** Attribue ou retire (valeur vide) une fonction d'adjoint. Président uniquement. */
modifierFonction(id: number, fonction: FonctionBureau | ''): Observable<ReponseActionMembre> {
  return this.http.patch<ReponseActionMembre>(
    `${this.BASE_URL}membres/membres/${id}/modifier-fonction/`,
    { fonctionBureau: fonction }
  ).pipe(tap((reponse) => this.mettreAJourMembre(reponse.membre)));
}

// Adresse publique des liens d'invitation (environment.URL_PUBLIQUE)
private readonly URL_ACTIVATION = environment.URL_PUBLIQUE;

/** Renvoyer l'invitation : réservé au président et au secrétaire. */
peutRenvoyerInvitation(membre: Membre, utilisateur: { role: string } | null): boolean {
  return membre.statut === 'en_attente'
    && (utilisateur?.role === 'president' || utilisateur?.role === 'secretaire');
}

/**
 * Génère un nouveau lien d'invitation (valable 72 h, l'ancien ne fonctionne
 * plus) et ouvre WhatsApp avec le message, comme lors de l'ajout d'un membre.
 * POST /api/membres/membres/<id>/renvoyer-invitation/
 */
renvoyerInvitation(membre: Membre): Observable<ReponseActionMembre> {
  return this.http.post<ReponseActionMembre>(
    `${this.BASE_URL}membres/membres/${membre.id}/renvoyer-invitation/`, {}
  ).pipe(tap((reponse) => {
    this.mettreAJourMembre(reponse.membre);
    if (reponse.tokenInvitation) {
      this.ouvrirWhatsAppInvitation(reponse.membre, reponse.tokenInvitation);
    }
  }));
}

private ouvrirWhatsAppInvitation(membre: Membre, token: string): void {
  let numero = membre.telephone.replace(/\s+/g, '');
  if (!numero.startsWith('221')) {
    numero = '221' + numero;
  }

  const lien = `${this.URL_ACTIVATION}/activation?token=${token}`;
  const message =
    `Bonjour ${membre.prenom},\n\n` +
    `Voici votre nouveau lien pour activer votre compte SunuGestion ` +
    `et choisir votre code PIN (valable 72 heures) : ${lien}`;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

/** Le bouton Activer / Désactiver n'est affiché qu'au président. */
voitBoutonStatut(utilisateur: { role: string } | null): boolean {
  return utilisateur?.role === 'president';
}

/**
 * Raison pour laquelle le président ne peut pas activer / désactiver ce
 * compte (mêmes règles que le backend), ou null si l'action est possible.
 */
raisonStatutImpossible(membre: Membre, utilisateur: { id: number } | null): string | null {
  if (membre.id === utilisateur?.id) {
    return 'Vous ne pouvez pas désactiver votre propre compte.';
  }
  if (membre.role === 'tresorier') {
    return 'Le trésorier ne peut pas être désactivé. Changez d\'abord son rôle.';
  }
  if (membre.statut === 'en_attente') {
    return 'Ce compte n\'a jamais été activé par le membre.';
  }
  return null;
}

peutChangerStatut(membre: Membre, utilisateur: { id: number; role: string } | null): boolean {
  return this.voitBoutonStatut(utilisateur)
    && this.raisonStatutImpossible(membre, utilisateur) === null;
}

/** Message d'erreur lisible renvoyé par l'API des membres. */
messageErreur(err: any, defaut: string): string {
  return err?.error?.erreur ?? err?.error?.detail ?? defaut;
}

private mettreAJourMembre(membre: Membre): void {
  this.membres.update((liste) =>
    liste.map((m) => (m.id === membre.id ? { ...m, ...membre } : m))
  );
}

// Méthode pour charger la liste
chargerMembres(): Observable<ReponseMembres> {
  this.isLoading.set(true);
  this.errorMessage.set(null);

  return this.http.get<ReponseMembres>(`${this.BASE_URL}membres/membres/`).pipe(
    tap((reponse) => {
      this.membres.set(reponse.membres);
      this.statsMembres.set({
        total: reponse.total,
        actifs: reponse.actifs,
        inactifs: reponse.inactifs,
        enAttente: reponse.enAttente
      });
      this.isLoading.set(false);
    }),
    catchError((err) => {
      this.isLoading.set(false);
      this.errorMessage.set(err?.error?.detail ?? 'Erreur lors du chargement');
      return throwError(() => err);
    })
  );


}


// --- Import Image : analyse OCR via OcrService ---
analyserImage(fichier: File): Observable<ProcessDocumentResponse> {
  // Validation côté client avant envoi
  const erreurFichier = this.ocrService.validerFichier(fichier);
  if (erreurFichier) {
    this.errorMessage.set(erreurFichier);
    return throwError(() => new Error(erreurFichier));
  }

  this.isLoading.set(true);
  this.errorMessage.set(null);

  return this.ocrService.processDocument(fichier).pipe(
    tap((reponse: ProcessDocumentResponse) => {
      // Stocker le résultat brut OCR
      this.ocrResultBrut.set(reponse);

      // Mapper PersonExtraite[] → MembreExcel[] avec statut valide/erreur
      const membres: MembreExcel[] = reponse.persons.map((p: PersonExtraite) => {
        const aErreurs = p['erreurs'] && p['erreurs'].length > 0;
        return {
          prenom: p['prenom'] ?? '',
          nom: p['nom'] ?? '',
          telephone: p['telephone'] ?? '',
          role: p['role'] ?? '',
          statut: aErreurs ? 'erreur' as const : 'valide' as const,
          erreurs: p['erreurs'] ?? []
        };
      });

      this.membresAnalyses.set(membres);
      this.statsAnalyse.set({
        total: reponse.count,
        valides: reponse.validCount,
        erreurs: reponse.invalidCount
      });
      this.isLoading.set(false);
    }),
    catchError((err) => {
      this.isLoading.set(false);
      this.errorMessage.set(err?.message ?? err?.error?.detail ?? "Analyse de l'image échouée");
      return throwError(() => err);
    })
  );
}


}





