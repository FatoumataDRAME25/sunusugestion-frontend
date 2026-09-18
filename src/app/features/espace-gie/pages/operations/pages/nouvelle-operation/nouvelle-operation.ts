import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { BottomNav } from '../../../../../../shared/ui/bottom-nav/bottom-nav';
import { HistoriqueOperationService } from '../../../../../../core/services/historique-operation.service';


@Component({
  selector: 'app-nouvelle-operation',
  imports: [ReactiveFormsModule, RouterLink, InputTextModule, TextareaModule, DialogModule, BottomNav],
  templateUrl: './nouvelle-operation.html'
})
export class NouvelleOperation {
  private historiqueService = inject(HistoriqueOperationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  voirSucces = signal(false);

  form: FormGroup = this.fb.group({
    typeOperation: ['entree', Validators.required],
    libelle:       ['', Validators.required],
    montant:       [null, [Validators.required, Validators.min(1)]],
    date:          [new Date().toISOString().split('T')[0], Validators.required],
    note:          ['']
  });

  get typeOperation() { return this.form.get('typeOperation')!; }
  get libelle()       { return this.form.get('libelle')!; }
  get montant()       { return this.form.get('montant')!; }

  setType(type: 'entree' | 'sortie'): void {
    this.typeOperation.setValue(type);
  }

  enregistrer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { typeOperation, montant, libelle } = this.form.value;
    this.isSaving.set(true);

    this.historiqueService.creerOperation(typeOperation, montant, libelle).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.voirSucces.set(true);
      },
      error: (e) => {
        console.error(e);
        this.isSaving.set(false);
      }
    });
  }

  retourTableauDeBord(): void {
  this.voirSucces.set(false);
  this.router.navigate(['/mon-espace']);
}


  nouvelleOperation(): void {
    this.voirSucces.set(false);
    this.form.reset({
      typeOperation: 'entree',
      libelle: '',
      montant: null,
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
  }
}
