import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gie-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './gie-sidebar.html',
})
export class GieSidebar {

  private authService = inject(AuthService);
  private router = inject(Router);

  deconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
