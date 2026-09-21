import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OcrResult, ProcessDocumentResponse } from '../models/ocr.model';

@Injectable({ providedIn: 'root' })
export class OcrService {

  private http = inject(HttpClient);

  // Base URL du service OCR — séparé de l'API Django
  private readonly OCR_BASE_URL = 'http://localhost:8000';

  // Contraintes identiques au backend OCR
  readonly FORMATS_ACCEPTES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  readonly TAILLE_MAX_MO = 5;

  /** Validation du fichier côté Angular avant envoi */
  validerFichier(file: File): string | null {
    if (!this.FORMATS_ACCEPTES.includes(file.type)) {
      return 'Format non supporté. Formats acceptés : JPEG, PNG, WEBP.';
    }
    if (file.size > this.TAILLE_MAX_MO * 1024 * 1024) {
      return `Fichier trop volumineux. Maximum : ${this.TAILLE_MAX_MO} Mo.`;
    }
    return null;
  }

  /** OCR brut — retourne uniquement le texte extrait */
  extractText(file: File): Observable<OcrResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<OcrResult>(`${this.OCR_BASE_URL}/api/ocr`, formData)
      .pipe(catchError(this.gererErreur));
  }

  /** OCR + validation des champs membres via n8n */
  processDocument(file: File): Observable<ProcessDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ProcessDocumentResponse>(`${this.OCR_BASE_URL}/api/process-document`, formData)
      .pipe(catchError(this.gererErreur));
  }

  /** Vérifie que le service OCR est disponible */
  healthCheck(): Observable<{ status: string }> {
    return this.http
      .get<{ status: string }>(`${this.OCR_BASE_URL}/ocr/health`)
      .pipe(catchError(this.gererErreur));
  }

  private gererErreur(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.detail ?? 'Une erreur est survenue avec le service OCR.';
    return throwError(() => new Error(message));
  }
}
