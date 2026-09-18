import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from '../../shared/ui/bottom-nav/bottom-nav';

@Component({
  imports: [RouterOutlet, BottomNav],
  selector: 'app-mobile-layout',
  styleUrl: './mobile-layout.css',
  templateUrl: './mobile-layout.html',
})
export class MobileLayout {}
