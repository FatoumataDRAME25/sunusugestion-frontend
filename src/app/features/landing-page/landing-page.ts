import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-landing-page',
  styleUrl: './landing-page.css',
  templateUrl: './landing-page.html',
})
export class LandingPage {

  menuOuvert = signal(false);

  toggleMenu(): void { this.menuOuvert.update(v => !v); }
  fermerMenu(): void { this.menuOuvert.set(false); }

  scrollVers(id: string): void {
    this.fermerMenu();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
