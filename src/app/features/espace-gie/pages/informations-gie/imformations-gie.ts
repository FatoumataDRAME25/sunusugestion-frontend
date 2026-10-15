import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EspaceGieService } from '../../../../core/services/espace-gie.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';
import { InputTextModule } from 'primeng/inputtext';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../../shared/ui/navbar/navbar';
import { GieSidebar } from '../../../../shared/ui/gie-sidebar/gie-sidebar';
import { CarteAbonnement } from './carte-abonnement/carte-abonnement';

@Component({
  imports: [BottomNav, ReactiveFormsModule, RouterLink, DatePipe, InputTextModule, NgClass, Navbar, GieSidebar, CarteAbonnement],
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
    typeGie: [''],
    telephone: [''],
    description: ['']
  });

  // Mêmes types d'organisation que ceux proposés à l'inscription
  readonly typesOrganisation = [
    { label: 'Association', value: 'association' },
    { label: 'Organisation communautaire', value: 'organisation_communautaire' },
    { label: 'Groupement', value: 'groupement' },
    { label: 'Autre', value: 'autre' },
  ];

  ngOnInit(): void {
    // Seul le président peut changer le type d'organisation
    if (!this.estPresident) {
      this.form.get('typeGie')!.disable();
    }


    this.gieService.chargerInfos().subscribe({
      next: (infos) => {
        // Pré-remplir le formulaire avec les données reçues
        this.form.patchValue({
          nom: infos.nom,
          region: infos.region,
          typeGie: infos.typeGie,
          telephone: infos.telephone ?? '',
        });
      }
    });
  }

  enregistrer(): void {
    if (this.form.pristine) return; // rien n'a changé

    const { nom, region, typeGie, telephone } = this.form.value;

    this.gieService.modifierInfos({ nom, region, typeGie, telephone }).subscribe({
      next: () => {
        this.succes.set(true);
        this.form.markAsPristine();
        setTimeout(() => this.succes.set(false), 3000);
      }
    });
  }
}
