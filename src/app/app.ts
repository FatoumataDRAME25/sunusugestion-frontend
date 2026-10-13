import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { map, startWith } from 'rxjs';
import { AssistantChatbot } from './features/espace-gie/pages/assistant-chatbot/assistant-chatbot';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, DatePickerModule, SelectModule, FormsModule, TagModule, AssistantChatbot],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  dateTest: Date | undefined;
  protected readonly title = signal('sunugestion');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      startWith(null),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly showAssistant = computed(() => {
    const url = this.currentUrl() || '';
    return (
      url.startsWith('/mon-espace') ||
      url.startsWith('/dashboard-president') ||
      url.startsWith('/espaces-gie')
    );
  });
}
