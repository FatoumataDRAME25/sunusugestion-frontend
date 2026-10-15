import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeFrSn from '@angular/common/locales/fr-SN';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Nécessaire pour formater les dates en français (ex : date:'d MMMM yyyy':'':'fr')
registerLocaleData(localeFr);
// Langue par défaut de l'application : montants « 1 250 000 », mois en français
registerLocaleData(localeFrSn);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
