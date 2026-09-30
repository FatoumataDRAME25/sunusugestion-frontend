import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { HistoriqueOperationService } from '../../../../../../core/services/historique-operation.service';
import { HistoriqueOperationDetail } from '../../../../../../core/models/historique-operation.model';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';

@Component({
  selector: 'app-detail-operation',
  templateUrl: './detail-operation.html',
  imports: [ DecimalPipe, DatePipe, Navbar, BottomNav],
})
export class DetailOperation implements OnInit {

  private historiqueService = inject(HistoriqueOperationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  operation = signal<HistoriqueOperationDetail | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.historiqueService.getOperation(id).subscribe({
      next: (op) => {
        this.operation.set(op);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Opération introuvable.');
        this.isLoading.set(false);
      }
    });
  }

  retour(): void {
    this.router.navigate(['/mon-espace/historiques']);
  }
}
