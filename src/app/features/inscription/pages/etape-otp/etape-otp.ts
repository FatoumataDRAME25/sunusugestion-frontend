// features/inscription/pages/etape-otp/etape-otp.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';

import { InscriptionService } from '../../services/inscription.service';

@Component({
  selector: 'app-etape-otp',
  imports: [FormsModule, ButtonModule, InputOtpModule],
  templateUrl: './etape-otp.html'
})
export class EtapeOtp implements OnInit, OnDestroy {
  protected service = inject(InscriptionService);
  private router = inject(Router);

  code = signal('');
  secondesRestantes = signal(45);
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.demarrerCompteARebours();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private demarrerCompteARebours(): void {
    this.secondesRestantes.set(45);
    this.intervalId = setInterval(() => {
      this.secondesRestantes.update((s) => {
        if (s <= 1) {
          clearInterval(this.intervalId);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  renvoyerCode(): void {
    if (this.secondesRestantes() > 0) return;
    // Le renvoi est géré par le même endpoint /inscription/ côté backend,
    // à rappeler ici si besoin selon confirmation ultérieure du contrat
    this.demarrerCompteARebours();
  }

  verifier(): void {
    this.service.verifierOtp(this.code()).subscribe({
      next: () => this.router.navigate(['/inscription/succes'])
    });
  }
}
