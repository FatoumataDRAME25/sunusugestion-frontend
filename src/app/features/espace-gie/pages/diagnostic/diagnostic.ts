import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DiagnosticResponse } from '../../../../core/models/diagnostic.model';
import { DiagnosticService } from '../../../../core/services/diagnostic.service';


@Component({
  selector: 'app-diagnostic',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './diagnostic.html',
  styleUrl: './diagnostic.css',
})
export class Diagnostic implements OnInit {

  private readonly diagnosticService = inject(DiagnosticService);

  diagnostic = signal<DiagnosticResponse | null>(null);
  chargement = signal<boolean>(false);
  erreur = signal<string | null>(null);

  ngOnInit(): void {
    this.chargerDiagnostic();
  }

  chargerDiagnostic(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.diagnosticService.getDiagnostic().subscribe({
      next: (reponse) => {
        this.diagnostic.set(reponse);
        this.chargement.set(false);
      },
      error: (erreur) => {
        console.error('Erreur lors du chargement du diagnostic :', erreur);

        this.erreur.set(
          erreur?.error?.detail ||
          erreur?.error?.message ||
          'Impossible de charger le diagnostic. Veuillez réessayer.'
        );

        this.chargement.set(false);
      }
    });
  }
}
