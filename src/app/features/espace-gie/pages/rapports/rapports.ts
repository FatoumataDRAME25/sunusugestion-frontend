import { Component, HostListener, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RapportService } from '../../../../core/services/rapport.service';
import { ParametresRapport, TypePeriode } from '../../../../core/models/rapport.model';

const ANNEE_MIN = 2000;

/** Refuse une période qui n'a pas encore commencé. */
function periodeCommencee(groupe: AbstractControl): ValidationErrors | null {
  const { typePeriode, annee, mois, trimestre } = groupe.value;
  const aujourdHui = new Date();
  const anneeCourante = aujourdHui.getFullYear();
  const moisCourant = aujourdHui.getMonth() + 1;

  let premierMois = 1;
  if (typePeriode === 'mensuel') {
    premierMois = +mois;
  } else if (typePeriode === 'trimestriel') {
    premierMois = (+trimestre - 1) * 3 + 1;
  }

  const future =
    +annee > anneeCourante ||
    (+annee === anneeCourante && premierMois > moisCourant);

  return future ? { periodeFuture: true } : null;
}

@Component({
  selector: 'app-rapport-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './rapports.html',
})
export class Rapports {

  private rapportService = inject(RapportService);
  private fb = inject(FormBuilder);

  private readonly aujourdHui = new Date();

  /** Émis lorsque l'utilisateur ferme la fenêtre. */
  fermer = output<void>();

  /** La fermeture est bloquée pendant la génération du rapport. */
  @HostListener('document:keydown.escape')
  demanderFermeture(): void {
    if (!this.enGeneration()) {
      this.fermer.emit();
    }
  }

  readonly typesPeriode: { valeur: TypePeriode; libelle: string }[] = [
    { valeur: 'mensuel', libelle: 'Mensuel' },
    { valeur: 'trimestriel', libelle: 'Trimestriel' },
    { valeur: 'annuel', libelle: 'Annuel' },
  ];

  readonly listeMois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ].map((libelle, index) => ({ valeur: index + 1, libelle }));

  readonly listeTrimestres = [
    { valeur: 1, libelle: 'T1 — janvier à mars' },
    { valeur: 2, libelle: 'T2 — avril à juin' },
    { valeur: 3, libelle: 'T3 — juillet à septembre' },
    { valeur: 4, libelle: 'T4 — octobre à décembre' },
  ];

  // De l'année en cours jusqu'à l'année minimale acceptée par le backend
  readonly listeAnnees = Array.from(
    { length: this.aujourdHui.getFullYear() - ANNEE_MIN + 1 },
    (_, index) => this.aujourdHui.getFullYear() - index
  );

  enGeneration = signal(false);
  erreur = signal<string | null>(null);
  fichierTelecharge = signal<string | null>(null);

  form: FormGroup = this.fb.group(
    {
      typePeriode: ['mensuel' as TypePeriode, Validators.required],
      annee: [this.aujourdHui.getFullYear(), [Validators.required, Validators.min(ANNEE_MIN)]],
      mois: [this.aujourdHui.getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      trimestre: [Math.floor(this.aujourdHui.getMonth() / 3) + 1, [Validators.required, Validators.min(1), Validators.max(4)]],
    },
    { validators: periodeCommencee }
  );

  get typePeriode(): TypePeriode { return this.form.get('typePeriode')!.value; }

  setTypePeriode(type: TypePeriode): void {
    this.form.get('typePeriode')!.setValue(type);
    this.erreur.set(null);
    this.fichierTelecharge.set(null);
  }

  generer(): void {
    if (this.enGeneration()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { typePeriode, annee, mois, trimestre } = this.form.value;

    const parametres: ParametresRapport = { typePeriode, annee: +annee };
    if (typePeriode === 'mensuel') {
      parametres.mois = +mois;
    } else if (typePeriode === 'trimestriel') {
      parametres.trimestre = +trimestre;
    }

    this.enGeneration.set(true);
    this.erreur.set(null);
    this.fichierTelecharge.set(null);

    this.rapportService.telechargerRapportPeriodique(parametres).subscribe({
      next: (pdf) => {
        const nomFichier = this.rapportService.nomFichier(parametres);
        this.enregistrerFichier(pdf, nomFichier);
        this.fichierTelecharge.set(nomFichier);
        this.enGeneration.set(false);
      },
      error: async (e: HttpErrorResponse) => {
        console.error('Erreur lors de la génération du rapport :', e);
        this.erreur.set(await this.messageErreur(e));
        this.enGeneration.set(false);
      }
    });
  }

  private enregistrerFichier(pdf: Blob, nomFichier: string): void {
    const url = URL.createObjectURL(
      new Blob([pdf], { type: 'application/pdf' })
    );

    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    // Laisser au navigateur le temps de démarrer le téléchargement
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * La requête attend un Blob : en cas d'erreur, le JSON renvoyé par l'API
   * arrive lui aussi sous forme de Blob et doit être relu.
   */
  private async messageErreur(e: HttpErrorResponse): Promise<string> {
    if (e.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.';
    }

    if (e.status === 403) {
      return 'Vous n\'êtes pas autorisé à générer ce rapport.';
    }

    if (e.error instanceof Blob) {
      try {
        const corps = JSON.parse(await e.error.text());
        const message = corps?.detail ?? corps?.message ?? Object.values(corps)[0];
        const texte = Array.isArray(message) ? message[0] : message;

        if (typeof texte === 'string' && texte) {
          return texte;
        }
      } catch {
        // Réponse non JSON : on garde le message générique
      }
    }

    return 'Impossible de générer le rapport. Veuillez réessayer.';
  }
}
