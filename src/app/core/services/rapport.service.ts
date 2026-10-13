import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ParametresRapport } from '../models/rapport.model';

@Injectable({
  providedIn: 'root'
})
export class RapportService {

  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  /**
   * Télécharge le rapport périodique de gestion (PDF) du groupement connecté.
   * Le groupement est déterminé par le backend à partir de l'utilisateur.
   */
  telechargerRapportPeriodique(parametres: ParametresRapport): Observable<Blob> {
    let params = new HttpParams()
      .set('type_periode', parametres.typePeriode)
      .set('annee', parametres.annee);

    if (parametres.typePeriode === 'mensuel' && parametres.mois) {
      params = params.set('mois', parametres.mois);
    }

    if (parametres.typePeriode === 'trimestriel' && parametres.trimestre) {
      params = params.set('trimestre', parametres.trimestre);
    }

    return this.http.get(
      `${this.BASE_URL}rapports/periodique/`,
      { params, responseType: 'blob' }
    );
  }

  /** Nom du fichier, identique à celui proposé par le backend. */
  nomFichier(parametres: ParametresRapport): string {
    let suffixe = `${parametres.annee}`;

    if (parametres.typePeriode === 'mensuel') {
      suffixe = `${parametres.annee}-${String(parametres.mois).padStart(2, '0')}`;
    } else if (parametres.typePeriode === 'trimestriel') {
      suffixe = `${parametres.annee}-T${parametres.trimestre}`;
    }

    return `rapport-gestion-${suffixe}.pdf`;
  }
}
