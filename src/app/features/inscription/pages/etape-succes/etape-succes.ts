
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { InscriptionService } from '../../services/inscription.service';

@Component({
  selector: 'app-etape-succes',
  imports: [ButtonModule, TagModule],
  templateUrl: './etape-succes.html'
})
export class EtapeSucces {
  protected service = inject(InscriptionService);
  private router = inject(Router);

  accederAMonEspace(): void {
    this.service.reinitialiser();
    this.router.navigate(['/mon-espace']);
  }
}
