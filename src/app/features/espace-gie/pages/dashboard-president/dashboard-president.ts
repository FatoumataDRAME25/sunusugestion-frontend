import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { EspaceGieService } from '../../../../core/services/espace-gie.service';
import { PretService } from '../../../../core/services/pret.service';
import { CotisationService } from '../../../../core/services/cotisation.service';
import { HistoriqueOperationService } from '../../../../core/services/historique-operation.service';
import { ActiviteService } from '../../../../core/services/activite.service';
import { HistoriqueOperation } from '../../../../core/models/historique-operation.model';
import { Solde } from '../../../../core/models/solde.model';
import { Activite } from '../../../../core/models/activite.model';
import { GieSidebar } from '../../../../shared/ui/gie-sidebar/gie-sidebar';
import { Navbar } from '../../../../shared/ui/navbar/navbar';
import { BottomNav } from '../../../../shared/ui/bottom-nav/bottom-nav';
import { Rapports } from '../rapports/rapports';

@Component({
  selector: 'app-dashboard-president',
  imports: [RouterLink, CommonModule, DecimalPipe, GieSidebar, Navbar, BottomNav, Rapports],
  templateUrl: './dashboard-president.html',
})
export class DashboardPresident implements OnInit {

  private authService       = inject(AuthService);
  private espaceGieService  = inject(EspaceGieService);
  private pretService       = inject(PretService);
  private cotisationService = inject(CotisationService);
  private historiqueService = inject(HistoriqueOperationService);
  private activiteService   = inject(ActiviteService);

  // ── Utilisateur connecté ──────────────────────────────────
  utilisateur = this.authService.currentUser;

  // ── Rôle ──────────────────────────────────────────────────
  estPresident = computed(() => this.utilisateur()?.role === 'president');
  estTresorier = computed(() => this.utilisateur()?.role === 'tresorier');

  // Indicateurs sur les prêts du groupement : président et trésorier uniquement.
  // Le secrétaire et le membre simple voient à la place leurs propres
  // cotisations et prêts.
  voitIndicateursPrets = computed(() => this.estPresident() || this.estTresorier());

  mesCotisationsNonPayees = computed(() => {
    const moi = this.utilisateur()?.id;
    return this.cotisationService.cotisations().filter(
      (c) => c.membre.id === moi && c.statut !== 'paye'
    );
  });

  mesPretsEnCours = computed(() => {
    const moi = this.utilisateur()?.id;
    return this.pretService.prets().filter(
      (p) => p.membre.id === moi && (p.statut === 'en_cours' || p.statut === 'en_retard')
    );
  });

  // ── Rapport périodique (président et trésorier uniquement) ─
  peutGenererRapport = computed(() => this.estPresident() || this.estTresorier());
  rapportOuvert = signal(false);

  // ── Stats membres (via EspaceGieService) ──────────────────
  membresActifs = computed(() => this.espaceGieService.stats().nombreMembres);

  // ── Solde caisse ──────────────────────────────────────────
  solde = signal<Solde | null>(null);

  // ── Cotisations collectées (session active) ───────────────
  sessionActive = this.cotisationService.sessionActive;

  // ── Prêts en attente ──────────────────────────────────────
  pretsEnAttente = computed(() =>
    this.pretService.prets().filter(p => p.statut === 'en_attente').slice(0, 3)
  );

  nbPretsEnAttente = computed(() =>
    this.pretService.prets().filter(p => p.statut === 'en_attente').length
  );

  // ── Prêts en retard ───────────────────────────────────────
  pretsEnRetard = computed(() =>
    this.pretService.prets().filter(p => p.statut === 'en_retard').slice(0, 3)
  );

  // ── Échéances à venir (trésorier) : prêts en_cours avec dateEcheance proche ─
  echeancesAVenir = computed(() =>
    this.pretService.prets()
      .filter(p => p.statut === 'en_cours' && p.dateEcheance !== null)
      .sort((a, b) => new Date(a.dateEcheance!).getTime() - new Date(b.dateEcheance!).getTime())
      .slice(0, 3)
  );

  // ── Retards cotisation (trésorier) : cotisations non payées ─────────────────
  retardsCotisation = computed(() =>
    this.cotisationService.cotisations()
      .filter(c => c.statut !== 'paye')
      .slice(0, 3)
  );

  totalRetardsCotisation = computed(() =>
    this.cotisationService.cotisations()
      .filter(c => c.statut !== 'paye')
      .reduce((sum, c) => sum + (c.session?.montant ?? 0), 0)
  );

  // ── Opérations récentes ───────────────────────────────────
  operationsRecentes = signal<HistoriqueOperation[]>([]);

  // ── Activités à venir ─────────────────────────────────────
  activitesAVenir = signal<Activite[]>([]);

  // ── Données graphique (entrées groupées par mois sur 10 mois) ────
  donneesGraphique = signal<{ mois: string; hauteur: number }[]>([]);
  maxGraphique = signal(0);

  // ── Chargement ────────────────────────────────────────────
  isLoading = signal(true);

  ngOnInit(): void {
    // Membres
    this.espaceGieService.chargerStats().subscribe({
      error: (err) => console.error('[Dashboard] erreur membres:', err)
    });

    // Prêts
    this.pretService.chargerPrets().subscribe({
      error: (err) => console.error('[Dashboard] erreur prêts:', err)
    });

    // Sessions cotisations + cotisations de la session active (pour retards trésorier)
    this.cotisationService.getSessions().subscribe({
      next: (sessions) => {
        const active = sessions.find(s => s.statut === 'ouverte');
        if (active) {
          this.cotisationService.getCotisations(active.id).subscribe({
            error: (err) => console.error('[Dashboard] erreur cotisations:', err)
          });
        }
      },
      error: (err) => console.error('[Dashboard] erreur sessions:', err)
    });

    // Solde caisse — même appel que l'historique
    this.historiqueService.getSolde().subscribe({
      next: (s) => {
        this.solde.set(s);
      },
      error: (err) => console.error('[Dashboard] erreur solde:', err)
    });

    // Activités à venir (planifiées, triées par date)
    this.activiteService.getActivites().subscribe({
      next: (liste) => {
        const maintenant = new Date();
        const aVenir = liste
          .filter(a => a.statut === 'planifiee' && new Date(a.dateActivite) >= maintenant)
          .sort((a, b) => new Date(a.dateActivite).getTime() - new Date(b.dateActivite).getTime())
          .slice(0, 3);
        this.activitesAVenir.set(aVenir);
      },
      error: (err) => console.error('[Dashboard] erreur activités:', err)
    });

    // Opérations récentes (3 dernières) + données graphique
    this.historiqueService.getOperations().subscribe({
      next: (ops) => {

        // 3 dernières opérations
        const triees = [...ops].sort(
          (a, b) => new Date(b.dateOperation).getTime() - new Date(a.dateOperation).getTime()
        );
        this.operationsRecentes.set(triees.slice(0, 3));

        // Graphique : entrées groupées par mois (10 derniers mois)
        this._construireGraphique(ops);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] erreur opérations:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ── Helpers affichage ─────────────────────────────────────
  private _construireGraphique(ops: HistoriqueOperation[]): void {
    // Générer les 10 derniers mois
    const moisLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const maintenant = new Date();
    const mois10: { cle: string; label: string }[] = [];

    for (let i = 9; i >= 0; i--) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = moisLabels[d.getMonth()];
      mois10.push({ cle, label });
    }

    // Sommer les entrées par mois (forcer number car l'API peut renvoyer des strings)
    const totauxParMois: Record<string, number> = {};
    for (const op of ops) {
      if (op.typeOperation !== 'entree') continue;
      const cle = op.dateOperation.substring(0, 7); // 'YYYY-MM'
      const montant = typeof op.montant === 'string' ? parseFloat(op.montant) : op.montant;
      if (!isNaN(montant)) {
        totauxParMois[cle] = (totauxParMois[cle] ?? 0) + montant;
      }
    }

    // Calculer la hauteur relative (max = 100%)
    const valeurs = mois10.map(m => totauxParMois[m.cle] ?? 0);
    const max = Math.max(...valeurs, 1);
    this.maxGraphique.set(max);

    const donnees = mois10.map((m, i) => ({
      mois: m.label,
      hauteur: Math.round((valeurs[i] / max) * 90) + 5 // min 5%, max 95%
    }));

    this.donneesGraphique.set(donnees);
  }

  moisActivite(dateStr: string): string {    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  labelEcheance(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase();
  }

  modePaiement(libelle: string): string {
    const l = libelle.toLowerCase();
    if (l.includes('wave')) return 'Wave';
    if (l.includes('orange money') || l.includes('orange_money')) return 'Orange Money';
    if (l.includes('virement')) return 'Virement';
    return 'Espèces';
  }

  libelleNettoye(libelle: string): string {
    // Retire les mentions de mode entre parenthèses ou après un tiret
    return libelle
      .replace(/\s*\(wave\)/gi, '')
      .replace(/\s*\(orange money\)/gi, '')
      .replace(/\s*\(orange_money\)/gi, '')
      .replace(/\s*\(espèces?\)/gi, '')
      .replace(/\s*\(virement\)/gi, '')
      .trim();
  }

  jourActivite(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  heureActivite(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  labelAxeY(ratio: number): string {
    const val = this.maxGraphique() * ratio;
    if (val === 0) return '0';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000) return Math.round(val / 1_000) + 'k';
    return Math.round(val).toString();
  }

  initiales2(prenom: string, nom: string): string {
    return `${prenom?.charAt(0) ?? ''}${nom?.charAt(0) ?? ''}`.toUpperCase();
  }

  couleurOperation(type: 'entree' | 'sortie'): string {
    return type === 'entree' ? 'text-[#2E7D5B]' : 'text-[#C1654A]';
  }

  prefixeOperation(type: 'entree' | 'sortie'): string {
    return type === 'entree' ? '+' : '-';
  }

  formaterDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      + ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
