import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AjouterMembreRequest,
  Membre,
  MembreExcel,
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


  // Signals à ajouter dans la classe
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

    // --- Ajout manuel ---
  ajouterMembre(donnees: AjouterMembreRequest): Observable<any> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.post<any>(`${this.BASE_URL}membres/membres/ajouter/`, donnees).pipe(
      tap((reponse) => {
        // On enregistre simplement les infos pour le modal de succès
        this.dernierMembreAjoute.set({ prenom: donnees.prenom, nom: donnees.nom });
        this.isLoading.set(false);
        // 🚀 La simulation sous forme d'alerte a été retirée d'ici.
        // C'est maintenant le composant Angular qui interceptera la "reponse"
        // contenant le vrai token_invitation.
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

  console.log('Body envoyé:', { membresValides });

  return this.http.post<ReponseImport>(
    `${this.BASE_URL}membres/membres/importer/`,
    { membres:membresValides }
  ).pipe(
    tap((reponse) => {
      console.log('Réponse import complète:', reponse);
      // Le backend peut retourner membresImportes ou membres_importes ou un simple count
      const nb =
        reponse.membresImportes?.length ??
        (reponse as any).membres_importes?.length ??
        (reponse as any).count ??
        membresValides.length;
      this.nombreMembresImportes.set(nb);
      this.isLoading.set(false);
    }),
    catchError((err) => {
      console.log('Erreur import complète:', err);
      console.log('Erreur import body:', err.error);
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

// Méthode pour charger la liste
chargerMembres(): Observable<ReponseMembres> {
  this.isLoading.set(true);
  this.errorMessage.set(null);

  return this.http.get<ReponseMembres>(`${this.BASE_URL}membres/membres/`).pipe(
    tap((reponse) => {
      console.log('Stats reçues:', reponse);
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





