import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EspaceGieService } from '../../../../core/services/espace-gie.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';
import { InputTextModule } from 'primeng/inputtext';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  imports: [BottomNav, ReactiveFormsModule, RouterLink, DatePipe, InputTextModule],
  selector: 'app-imformations-gie',
  styleUrl: './imformations-gie.css',
  templateUrl: './imformations-gie.html',
})
export class InformationsGie {

  protected gieService = inject(EspaceGieService);
  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Succès après sauvegarde
  succes = signal(false);

  // Seul le président peut modifier
  estPresident = this.authService.currentUser()?.role === 'president';

  form: FormGroup = this.fb.group({
    nom: [''],
    region: [''],
    secteur: [''],
    telephone: [''],
    description: ['']
  });

  ngOnInit(): void {
    this.gieService.chargerInfos().subscribe({
      next: (infos) => {
        // Pré-remplir le formulaire avec les données reçues
        this.form.patchValue({
          nom: infos.nom,
          region: infos.region,
          secteur: infos.secteur,
          telephone: infos.telephone ?? '',
        });
      }
    });
  }

  enregistrer(): void {
    if (this.form.pristine) return; // rien n'a changé

    this.gieService.modifierInfos(this.form.value).subscribe({
      next: () => {
        this.succes.set(true);
        this.form.markAsPristine();
        setTimeout(() => this.succes.set(false), 3000);
      }
    });
  }
}
