import { Component, HostListener, input, output } from '@angular/core';

/**
 * Fenêtre de confirmation simple, au centre de l'écran.
 * Se ferme par « Annuler », un clic à l'extérieur ou la touche Échap,
 * sauf pendant le traitement.
 */
@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.html',
})
export class ConfirmationModal {

  titre = input.required<string>();
  message = input.required<string>();
  libelleConfirmer = input('Confirmer');
  danger = input(false);
  enCours = input(false);
  erreur = input<string | null>(null);

  confirmer = output<void>();
  annuler = output<void>();

  @HostListener('document:keydown.escape')
  demanderAnnulation(): void {
    if (!this.enCours()) {
      this.annuler.emit();
    }
  }
}
