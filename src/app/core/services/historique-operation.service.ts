import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solde } from '../models/solde.model';
import { environment } from '../../../environments/environment';
import { HistoriqueOperation, HistoriqueOperationDetail } from '../models/historique-operation.model';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueOperationService {

  private http = inject(HttpClient);

  private readonly BASE_URL = environment.API_URL;

  getOperations(): Observable<HistoriqueOperation[]> {
    return this.http.get<HistoriqueOperation[]>(
      `${this.BASE_URL}historiques/`
    );
  }

  getOperation(id: number): Observable<HistoriqueOperationDetail> {
    return this.http.get<HistoriqueOperationDetail>(
      `${this.BASE_URL}historiques/${id}/`
    );
  }

  getSolde(): Observable<Solde> {
    return this.http.get<Solde>(
      `${this.BASE_URL}historiques/solde/`
    );
  }

  creerOperation(
    typeOperation: 'entree' | 'sortie',
    montant: number,
    libelle: string
  ): Observable<HistoriqueOperation> {

    return this.http.post<HistoriqueOperation>(
      `${this.BASE_URL}historiques/operations/`,
      {
        typeOperation,
        montant,
        libelle
      }
    );
  }
}
