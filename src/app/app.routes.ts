import { Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { MainLayout } from './layout/main-layout/main-layout/main-layout';
import { Dashboard } from './features/espace-admin/pages/dashboard/dashboard';
import { EspacesGieList } from './features/espace-admin/pages/espaces-gie-list/espaces-gie-list';
import { Profil } from './features/espace-admin/pages/profil/profil';
import { Accueil } from './features/vitrine/pages/accueil/accueil';
import { EtapeGie } from './features/inscription/pages/etape-gie/etape-gie';
import { EtapeCompte } from './features/inscription/pages/etape-compte/etape-compte';
import { EtapeOtp } from './features/inscription/pages/etape-otp/etape-otp';
import { EtapeSucces } from './features/inscription/pages/etape-succes/etape-succes';
import { MobileLayout } from './layout/mobile-layout/mobile-layout';
import { AccueilEspace } from './features/espace-gie/pages/accueil-espace/accueil-espace';
import { Historique } from './features/espace-gie/pages/operations/pages/historiques/historique';
import { ProfilMembre } from './features/espace-gie/pages/profil-membre/profil-membre';
import { ListeMembre } from './features/espace-gie/pages/membres/pages/liste-membre/liste-membre';
import { AjouterMembre } from './features/espace-gie/pages/membres/pages/ajouter-membre/ajouter-membre';
import { ImporterMembre } from './features/espace-gie/pages/membres/pages/importer-membre/importer-membre';
import { InformationsGie } from './features/espace-gie/pages/informations-gie/imformations-gie';
import { NouvelleOperation } from './features/espace-gie/pages/operations/pages/nouvelle-operation/nouvelle-operation';
import { ListeCotisations } from './features/espace-gie/pages/cotisations/pages/liste-cotisation/liste-cotisation';
import { SessionCotisation } from './features/espace-gie/pages/cotisations/pages/session-cotisation/session-cotisation';






export const routes: Routes = [

  { path: 'acceuil', component: Accueil },
  { path: 'login', component: Login },
  { path: 'inscription/gie', component: EtapeGie },
  { path: 'inscription/compte', component: EtapeCompte },
  { path: 'inscription/otp', component: EtapeOtp },
  { path: 'inscription/succes', component: EtapeSucces },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Les routes pour l'admin
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'espaces-gie', component: EspacesGieList },
      { path: 'dashboard', component: Dashboard },
      { path: 'profil', component: Profil },
    ]
  },

  // Les routes pour la navigation au sein du GIE

  {
  path: 'mon-espace',
  component: MobileLayout,
  children: [

    { path: '', component: AccueilEspace },
    { path: 'informations-gie', component: InformationsGie },
    { path: 'historiques', component: Historique },
    { path: 'historiques/nouvelle-operation', component: NouvelleOperation },
    { path: 'membres/ajouter', component: AjouterMembre },
    { path: 'membres/importer', component: ImporterMembre },
    { path: 'membres', component: ListeMembre },
    { path: 'cotisations', component: ListeCotisations },
    { path: 'cotisations/session-cotisation', component: SessionCotisation },

    { path: 'profil-membre', component: ProfilMembre }

  ]
}
];
