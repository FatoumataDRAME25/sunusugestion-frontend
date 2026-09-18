import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/ui/sidebar/sidebar';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  imports: [RouterOutlet, Sidebar, ConfirmDialog],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
  providers: [ConfirmationService],
})
export class MainLayout {}
