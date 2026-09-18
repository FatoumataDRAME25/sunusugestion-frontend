import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, DatePickerModule,SelectModule, FormsModule, TagModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  dateTest: Date | undefined;
  protected readonly title = signal('sunugestion');
}
