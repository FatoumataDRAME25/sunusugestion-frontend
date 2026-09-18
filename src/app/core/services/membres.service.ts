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

@Injectable({ providedIn: 'root' })
export class MembresService {


  private http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

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

  return this.http.post(`${this.BASE_URL}membres/membres/ajouter/`, donnees).pipe(
    tap(() => {
      this.dernierMembreAjoute.set({ prenom: donnees.prenom, nom: donnees.nom });
      this.isLoading.set(false);
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
      this.nombreMembresImportes.set(reponse.membresImportes.length);
      this.isLoading.set(false);
    }),
    catchError((err) => {
      console.log('Erreur import complète:', err.error);
      this.isLoading.set(false);
      this.errorMessage.set(err?.error?.erreur ?? err?.error?.detail ?? "Erreur lors de l'import");
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

}





