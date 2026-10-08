
import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';

import { InscriptionService } from '../../services/inscription.service';

@Component({
  selector: 'app-etape-otp',
  imports: [
    FormsModule,
    ButtonModule,
    InputOtpModule
  ],
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
    this.arreterCompteARebours();
  }

  private demarrerCompteARebours(): void {
    this.arreterCompteARebours();

    this.secondesRestantes.set(45);

    this.intervalId = setInterval(() => {
      this.secondesRestantes.update((secondes) => {
        if (secondes <= 1) {
          this.arreterCompteARebours();
          return 0;
        }

        return secondes - 1;
      });
    }, 1000);
  }

  private arreterCompteARebours(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  renvoyerCode(): void {
    if (this.secondesRestantes() > 0 || this.service.isLoading()) {
      return;
    }

    this.service.renvoyerOtp().subscribe({
      next: () => {
        this.demarrerCompteARebours();
        this.code.set('');
      }
    });
  }

  verifier(): void {
    const otp = this.code().trim();

    if (!/^[0-9]{6}$/.test(otp)) {
      return;
    }

    if (this.service.isLoading()) {
      return;
    }

    this.service.verifierOtp(otp).subscribe({
      next: () => {
        this.router.navigate(['/inscription/succes']);
      }
    });
  }
}

