import { Component, signal, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DiagnosticService } from '../../../../core/services/diagnostic.service';
import { DiagnosticResponse } from '../../../../core/models/diagnostic.model';
import { AssistantChatbotService } from '../../../../core/services/chatbot.service';

interface MessageChat {
  id: number;
  contenu: string;
  auteur: 'utilisateur' | 'assistant';
  date: Date;
}

@Component({
  selector: 'app-assistant-chatbot',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './assistant-chatbot.html',
  styleUrl: './assistant-chatbot.css',
})
export class AssistantChatbot {
  private readonly diagnosticService = inject(DiagnosticService);
  private readonly assistantChatbotService = inject(AssistantChatbotService);

  // État du chatbot
  ouvert = signal(false);
  chargement = signal(false);
  erreur = signal<string | null>(null);
  diagnostic = signal<DiagnosticResponse | null>(null);

  // Gestion de la conversation
  question = '';
  envoiEnCours = signal(false);
  messages = signal<MessageChat[]>([]);

  private prochainId = 1;

  // Ouvrir le chatbot
  ouvrirChatbot(): void {
    this.ouvert.set(true);

    if (!this.diagnostic() && !this.chargement()) {
      this.chargerDiagnostic();
    }
  }

  // Fermer le chatbot
  fermerChatbot(): void {
    this.ouvert.set(false);
  }

  // Charger le diagnostic financier
  chargerDiagnostic(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.diagnosticService.getDiagnostic().subscribe({
      next: (reponse) => {
        this.diagnostic.set(reponse);
        this.chargement.set(false);
      },
      error: (erreur) => {
        console.error(
          'Erreur lors du chargement du diagnostic :',
          erreur
        );

        this.erreur.set(
          erreur?.error?.detail ||
          erreur?.error?.message ||
          'Impossible de charger le diagnostic financier. Veuillez réessayer.'
        );

        this.chargement.set(false);
      },
    });
  }

  // Réessayer de charger le diagnostic
  reessayer(): void {
    this.chargerDiagnostic();
  }

  // Ajouter un message à la conversation
  private ajouterMessage(
    contenu: string,
    auteur: MessageChat['auteur']
  ): void {
    this.messages.update((messages) => [
      ...messages,
      {
        id: this.prochainId++,
        contenu,
        auteur,
        date: new Date(),
      },
    ]);
  }

  // Envoyer une question au chatbot
  envoyerMessage(): void {
    const contenu = this.question.trim();

    if (!contenu || this.envoiEnCours()) {
      return;
    }

    // Ajouter la question à la conversation
    this.ajouterMessage(contenu, 'utilisateur');

    // Vider le champ de saisie
    this.question = '';

    // Activer l'indicateur de chargement
    this.envoiEnCours.set(true);

    // Envoyer la question au backend Django
    this.assistantChatbotService.envoyerQuestion(contenu).subscribe({
      next: (resultat) => {
        if (resultat?.reponse) {
          this.ajouterMessage(resultat.reponse, 'assistant');
        } else {
          this.ajouterMessage(
            'Je n’ai pas reçu de réponse exploitable. Veuillez réessayer.',
            'assistant'
          );
        }

        this.envoiEnCours.set(false);
      },

      error: (erreur) => {
        console.error(
          'Erreur lors de l’envoi de la question au chatbot :',
          erreur
        );

        let messageErreur =
          'Une erreur est survenue. Veuillez réessayer.';

        if (erreur?.status === 401) {
          messageErreur =
            'Votre session a expiré. Veuillez vous reconnecter.';
        } else if (erreur?.status === 403) {
          messageErreur =
            'Votre compte ne possède pas de groupement associé.';
        } else if (erreur?.status === 503) {
          messageErreur =
            erreur?.error?.detail ||
            'Le service IA est momentanément indisponible. Réessayez plus tard.';
        } else if (erreur?.status === 429) {
          messageErreur =
            'Vous avez atteint la limite de 20 questions par heure. Réessayez un peu plus tard.';
        } else if (erreur?.status === 0) {
          messageErreur =
            'Impossible de joindre le serveur. Vérifiez votre connexion.';
        } else if (erreur?.error?.detail) {
          messageErreur = erreur.error.detail;
        }

        this.ajouterMessage(messageErreur, 'assistant');
        this.envoiEnCours.set(false);
      },
    });
  }
}
