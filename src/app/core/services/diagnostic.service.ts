import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DiagnosticResponse } from '../models/diagnostic.model';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {

  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.API_URL;

  /**
   * Récupère les indicateurs financiers et l'analyse IA du groupement connecté.
   */
  getDiagnostic(): Observable<DiagnosticResponse> {
    return this.http.get<DiagnosticResponse>(
      `${this.BASE_URL}diagnostic/`
    );
  }
}
