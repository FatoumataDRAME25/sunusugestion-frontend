import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLinkActive, RouterLink],
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.html',
})
export class BottomNav {
  menuPlusOuvert = signal(false);

  toggleMenuPlus(): void {
    this.menuPlusOuvert.update(v => !v);
  }

  fermerMenuPlus(): void {
    this.menuPlusOuvert.set(false);
  }
}
