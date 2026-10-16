import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

// Chaque page est chargée à la demande (loadComponent) : elle n'est téléchargée
// qu'au moment où l'utilisateur l'ouvre, ce qui allège le démarrage.
export const routes: Routes = [

  { path: '', loadComponent: () => import('./features/landing-page/landing-page').then(m => m.LandingPage) },
  // Ancienne vitrine remplacée par la page d'accueil du site : l'adresse reste valable
  { path: 'sunugestion-vitrine', redirectTo: '', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login) },
  { path: 'inscription/gie', loadComponent: () => import('./features/inscription/pages/etape-gie/etape-gie').then(m => m.EtapeGie) },
  { path: 'inscription/compte', loadComponent: () => import('./features/inscription/pages/etape-compte/etape-compte').then(m => m.EtapeCompte) },
  { path: 'inscription/otp', loadComponent: () => import('./features/inscription/pages/etape-otp/etape-otp').then(m => m.EtapeOtp) },
  { path: 'inscription/succes', loadComponent: () => import('./features/inscription/pages/etape-succes/etape-succes').then(m => m.EtapeSucces) },

  // Les routes pour l'admin
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [adminGuard],
    children: [
      { path: 'espaces-gie', loadComponent: () => import('./features/espace-admin/pages/espaces-gie-list/espaces-gie-list').then(m => m.EspacesGieList) },
      { path: 'dashboard', loadComponent: () => import('./features/espace-admin/pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'profil', loadComponent: () => import('./features/espace-admin/pages/profil/profil').then(m => m.Profil) },
    ]
  },
  { path: 'activation', loadComponent: () => import('./features/espace-gie/pages/membres/pages/activer-compte/activer-compte').then(m => m.ActiverCompte) },

  // Les routes pour la navigation au sein du GIE

  {
  path: 'mon-espace',
  loadComponent: () => import('./layout/mobile-layout/mobile-layout').then(m => m.MobileLayout),
  canActivate: [authGuard],
  children: [

   
    // tous les liens vers /mon-espace y mènent
    { path: '', pathMatch: 'full', redirectTo: '/mon-espace/dashboard-president' },
    { path: 'informations-gie', loadComponent: () => import('./features/espace-gie/pages/informations-gie/imformations-gie').then(m => m.InformationsGie) },
    { path: 'historiques', loadComponent: () => import('./features/espace-gie/pages/operations/pages/historiques/historique').then(m => m.Historique) },
    {
      path: 'historiques/nouvelle-operation',
      loadComponent: () => import('./features/espace-gie/pages/operations/pages/nouvelle-operation/nouvelle-operation').then(m => m.NouvelleOperation),
      canActivate: [roleGuard],
      data: { roles: ['tresorier'] }
    },
    { path: 'historiques/:id', loadComponent: () => import('./features/espace-gie/pages/operations/pages/detail-operation/detail-operation').then(m => m.DetailOperation) },
    {
      path: 'membres/ajouter',
      loadComponent: () => import('./features/espace-gie/pages/membres/pages/ajouter-membre/ajouter-membre').then(m => m.AjouterMembre),
      canActivate: [roleGuard],
      data: { roles: ['president', 'secretaire'] }
    },
    {
      path: 'membres/importer',
      loadComponent: () => import('./features/espace-gie/pages/membres/pages/importer-membre/importer-membre').then(m => m.ImporterMembre),
      canActivate: [roleGuard],
      data: { roles: ['president', 'secretaire'] }
    },
    { path: 'membres', loadComponent: () => import('./features/espace-gie/pages/membres/pages/liste-membre/liste-membre').then(m => m.ListeMembre) },
    // Après « ajouter » et « importer » pour ne pas les intercepter
    { path: 'membres/:id', loadComponent: () => import('./features/espace-gie/pages/membres/pages/fiche-membre/fiche-membre').then(m => m.FicheMembre) },
    { path: 'bureau', loadComponent: () => import('./features/espace-gie/pages/bureau/bureau').then(m => m.Bureau) },
    { path: 'cotisations', loadComponent: () => import('./features/espace-gie/pages/cotisations/pages/liste-cotisation/liste-cotisation').then(m => m.ListeCotisations) },
    {
      path: 'cotisations/session-cotisation',
      loadComponent: () => import('./features/espace-gie/pages/cotisations/pages/session-cotisation/session-cotisation').then(m => m.SessionCotisation),
      canActivate: [roleGuard],
      data: { roles: ['tresorier'] }
    },
    { path: 'cotisations/payer/:id', loadComponent: () => import('./features/espace-gie/pages/cotisations/pages/payer-cotisation/payer-cotisation').then(m => m.PayerCotisation) },

    // ── Prêts ──
    { path: 'prets', loadComponent: () => import('./features/espace-gie/pages/prets/pages/liste-prets/liste-prets').then(m => m.ListePrets) },
    { path: 'prets/demande', loadComponent: () => import('./features/espace-gie/pages/prets/pages/demande-pret/demande-pret').then(m => m.DemandePret) },
    { path: 'prets/regles', loadComponent: () => import('./features/espace-gie/pages/prets/pages/regles-pret/regles-pret').then(m => m.ReglesPret) },
    {
      path: 'prets/demandes-a-traiter',
      loadComponent: () => import('./features/espace-gie/pages/prets/pages/demandes-a-traiter/demandes-a-traiter').then(m => m.DemandesATraiter),
      canActivate: [roleGuard],
      data: { roles: ['president'] }
    },
    { path: 'prets/:id', loadComponent: () => import('./features/espace-gie/pages/prets/pages/detail-pret/detail-pret').then(m => m.DetailPret) },

    // ── Activités ──
    { path: 'activites', loadComponent: () => import('./features/espace-gie/pages/activites/pages/liste-activites/liste-activites').then(m => m.ListeActivites) },
    {
      path: 'activites/planifier',
      loadComponent: () => import('./features/espace-gie/pages/activites/pages/planifier-activite/planifier-activite').then(m => m.PlanifierActivite),
      canActivate: [roleGuard],
      data: { roles: ['president', 'secretaire'] }
    },
    { path: 'activites/:id', loadComponent: () => import('./features/espace-gie/pages/activites/pages/detail-activite/detail-activite').then(m => m.DetailActivite) },
    { path: 'activites/:id/presences', loadComponent: () => import('./features/espace-gie/pages/activites/pages/presences-activite/presences-activite').then(m => m.PresencesActivite) },

    // le diagnostic

    {path: 'diagnostic', loadComponent: () => import('./features/espace-gie/pages/diagnostic/diagnostic').then(m => m.Diagnostic)},

    // ── Paiement PayDunya retour ──



    { path: 'profil-membre', loadComponent: () => import('./features/espace-gie/pages/profil-membre/profil-membre').then(m => m.ProfilMembre) }

  ]
},
{ path: 'paiement/retour', loadComponent: () => import('./features/espace-gie/pages/paiement/retour-paiement').then(m => m.RetourPaiement), canActivate: [authGuard] },
{ path: 'paiement/annule', loadComponent: () => import('./features/espace-gie/pages/paiement/annulation-paiement').then(m => m.AnnulationPaiement), canActivate: [authGuard] },
{ path: 'mon-espace/dashboard-president', loadComponent: () => import('./features/espace-gie/pages/dashboard-president/dashboard-president').then(m => m.DashboardPresident), canActivate: [authGuard] },
];
