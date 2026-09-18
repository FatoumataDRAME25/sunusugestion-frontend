import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLinkActive, RouterLink],
  selector: 'app-bottom-nav',
  styleUrl: './bottom-nav.css',
  templateUrl: './bottom-nav.html',
})
export class BottomNav {}
