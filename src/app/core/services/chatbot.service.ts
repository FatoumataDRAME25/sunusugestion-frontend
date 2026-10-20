import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ReponseChatbot {
  reponse: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssistantChatbotService {
  private readonly http = inject(HttpClient);

  private readonly BASE_URL = environment.API_URL;

  /**
   * Envoie une question au chatbot financier de SunuGestion.
   */
  envoyerQuestion(question: string): Observable<ReponseChatbot> {
    return this.http.post<ReponseChatbot>(
      `${this.BASE_URL}diagnostic/assistant/`,
      { question }
    );
  }
}
