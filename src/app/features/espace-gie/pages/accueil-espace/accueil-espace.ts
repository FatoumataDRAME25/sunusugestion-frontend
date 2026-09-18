

import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../../core/services/auth.service';
import { EspaceGieService } from '../../../../core/services/espace-gie.service';
import { InitialesPipe } from '../../../../shared/pipes/initiales-pipe';
import { DecimalPipe } from '@angular/common';



@Component({
  selector: 'app-accueil-espace',
  imports: [RouterLink, TagModule, InitialesPipe, DecimalPipe],
  templateUrl: './accueil-espace.html'
})
export class AccueilEspace implements OnInit{
  protected service = inject(EspaceGieService);
  protected authService = inject(AuthService);
  dropdownVisible = signal(false);


  toggleDropdown(): void {
    this.dropdownVisible.update(v => !v);
  }

  fermerDropdown(): void {
    this.dropdownVisible.set(false);
  }


  ngOnInit(): void {

    this.service.chargerStats().subscribe();
  }
}
