import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PretService } from '../../../../../../core/services/pret.service';
import { Navbar } from '../../../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { GieSidebar } from '../../../../../../shared/ui/gie-sidebar/gie-sidebar';

@Component({
  selector: 'app-demande-pret',
  templateUrl: './demande-pret.html',
  imports: [RouterLink, FormsModule, DecimalPipe, Navbar, BottomNav, GieSidebar],
})
export class DemandePret implements OnInit {

  protected service = inject(PretService);
  private router = inject(Router);

  montant = signal('');
  pretCree = signal<any>(null);
  succesVisible = signal(false);
  erreurMontant = signal<string | null>(null);

  ngOnInit(): void {
    this.service.errorMessage.set(null);
    // Un 404 signifie « aucune règle » : il alimente service.reglesAbsentes()
    this.service.chargerRegle().subscribe({ error: () => {} });
  }

  envoyer(): void {
    const val = String(this.montant()).trim();
    if (!val) {
      this.erreurMontant.set('Le montant est obligatoire.');
      return;
    }

    const montantNum = Number(val);
    if (isNaN(montantNum) || montantNum <= 0) {
      this.erreurMontant.set('Le montant doit être supérieur à 0.');
      return;
    }

    this.erreurMontant.set(null);

    this.service.demanderPret({ montant: val }).subscribe({
      next: (pret) => {
        this.pretCree.set(pret);
        this.succesVisible.set(true);
      }
    });
  }

  retourListe(): void {
    this.router.navigate(['/mon-espace/prets']);
  }
}
