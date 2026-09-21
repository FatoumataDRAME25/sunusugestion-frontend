import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../../../environments/environment';

@Component({
  imports: [ ReactiveFormsModule],
  selector: 'app-activer-compte',
  styleUrl: './activer-compte.css',
  templateUrl: './activer-compte.html',
})
export class ActiverCompte {

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  private readonly BASE_URL = environment.API_URL;

  token: string | null = null;

  // Gestion des différents écrans/étapes sur la même page
  statut = signal<'chargement' | 'formulaire' | 'succes' | 'erreur'>('chargement');
  messageErreur = signal<string>('');

  // Formulaire pour le choix du code PIN (ici configuré pour 4 chiffres obligatoires)
  formPin: FormGroup = this.fb.group(
  {
    pin: ['', [
      Validators.required,
      Validators.pattern(/^\d{4}$/)
    ]],

    confirmationPin: ['', [
      Validators.required
    ]]
  },
  {
    validators: this.verifierMemePin
  }
);

  ngOnInit(): void {
    // 1. On intercepte le token dans l'URL (?token=XYZ...)
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.statut.set('erreur');
      this.messageErreur.set("Le lien d'activation est invalide ou incomplet.");
      return;
    }

    // Le token est bien présent, on affiche le formulaire de création du PIN
    this.statut.set('formulaire');
  }

  // Validateur personnalisé pour vérifier que les deux PIN saisis sont identiques
  verifierMemePin(group: FormGroup) {
    const pin = group.get('pin')?.value;
    const confirmation = group.get('confirmationPin')?.value;
    return pin === confirmation ? null : { neCorrespondPas: true };
  }

  get pin() { return this.formPin.get('pin')!; }
  get confirmationPin() { return this.formPin.get('confirmationPin')!; }

   validerActivation(): void {
    if (this.formPin.invalid || !this.token) {
      this.formPin.markAllAsTouched();
      return;
    }

    this.statut.set('chargement');

    const payload = {
      token: this.token,
      pin: this.formPin.value.pin
    };

    // 2. Envoi du jeton et du PIN à la vue Django publique (Étape 4)
    this.http.post(`${this.BASE_URL}membres/membres/activation-compte/`, payload).subscribe({
      next: () => {
        this.statut.set('succes');

        // 3. Redirection automatique vers l'espace après 3 secondes de succès
        setTimeout(() => {
          this.router.navigate(['/login']); // Ou directement '/mon-espace' selon votre gestion des sessions
        }, 8000);
      },
      error: (err) => {
        this.statut.set('erreur');
        this.messageErreur.set(err?.error?.erreur || "Une erreur est survenue lors de l'activation.");
      }
    });
  }
}
