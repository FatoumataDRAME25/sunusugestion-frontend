import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MembresService } from '../../../../../../core/services/membres.service';
import { RoleMembre } from '../../../../../../core/models/membre.model';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';

@Component({
  selector: 'app-ajouter-membre',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    RouterLink,
    BottomNav
  ],
  templateUrl: './ajouter-membre.html'
})
export class AjouterMembre {
  protected service = inject(MembresService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  modalSuccesVisible = signal(false);

  // 🚀 METTEZ À JOUR VOTRE ADRESSE NGROK ICI LORSQU'ELLE CHANGE
  private urlNgrok = 'https://stitch-freebie-dreamless.ngrok-free.dev';

  rolesDisponibles: { label: string; value: RoleMembre }[] = [
    { label: 'Trésorier', value: 'tresorier' },
    { label: 'Secrétaire', value: 'secretaire' },
    { label: 'Membre simple', value: 'membre' }
  ];

   form: FormGroup = this.fb.group({
    prenom:    ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)]],
    nom:       ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)]],
    telephone: ['', [Validators.required, Validators.pattern(/^(70|71|75|76|77|78)\d{7}$/)
]],
    email:     ['', [Validators.email]],     // validator natif Angular, optionnel, pas de Validators.required
    role:      [null, [Validators.required]]
  });


  get prenom()    { return this.form.get('prenom')!; }
  get nom()       { return this.form.get('nom')!; }
  get telephone() { return this.form.get('telephone')!; }
  get email()     { return this.form.get('email')!; }
  get role()      { return this.form.get('role')!; }

  soumettre(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.service.isLoading.set(false);
      return;
    }

    const { email, ...donnees } = this.form.value;

    this.service.ajouterMembre(donnees).subscribe({

      next: (reponse) => {

        // 1. Récupération du token envoyé par Django
        const token = reponse.tokenInvitation;
        const prenomMembre = reponse.membre.prenom;

        // 2. Nettoyage du numéro
        let numTel = reponse.membre.telephone.replace(/\s+/g, '');

        // 3. Ajout de l'indicatif du Sénégal
        if (!numTel.startsWith('221')) {
          numTel = '221' + numTel;
        }

        // 4. Création du lien d'activation
        const lienActivation =
          `${this.urlNgrok}/activation?token=${token}`;

        // 5. Message WhatsApp
        const message =
          `Bonjour ${prenomMembre},\n\n` +
          `Bienvenue sur SunuGestion ! Pour activer votre compte ` +
          `et configurer votre code PIN d'accès, veuillez cliquer ` +
          `sur ce lien sécurisé : ${lienActivation}`;

        // 6. URL WhatsApp correcte
        const lienWhatsApp =
          `https://wa.me/${numTel}?text=${encodeURIComponent(message)}`;

        // 7. Ouvrir WhatsApp dans un nouvel onglet
        window.open(lienWhatsApp, '_blank');

        // 8. Afficher le modal de succès
        this.modalSuccesVisible.set(true);
      },

      error: (err) => {
        this.service.errorMessage.set(
          err?.error?.detail ?? 'Une erreur est survenue'
        );
      }

    });
  }
  voirLesMembres(): void {
    this.modalSuccesVisible.set(false);
    this.router.navigate(['/mon-espace/membres']);
  }

  ajouterUnAutre(): void {
    this.modalSuccesVisible.set(false);
    this.form.reset();
    this.service.errorMessage.set(null);
  }
}
