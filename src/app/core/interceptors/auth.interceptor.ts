import { HttpInterceptorFn, HttpClient, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const CLE_ACCESS = 'sunugestion_access';
const CLE_REFRESH = 'sunugestion_refresh';
const CLE_UTILISATEUR = 'sunugestion_user';

/**
 * Renouvellement en cours, partagé entre toutes les requêtes.
 *
 * Le backend fait tourner le jeton de renouvellement à chaque usage
 * (l'ancien est aussitôt invalidé). Si plusieurs requêtes expirées lançaient
 * chacune leur propre renouvellement avec le même jeton, seule la première
 * réussirait et les autres déconnecteraient l'utilisateur à tort.
 * Elles attendent donc toutes le même renouvellement.
 */
let renouvellementEnCours: Observable<string> | null = null;

/**
 * Endpoints publics : aucun jeton n'y est envoyé. Un ancien jeton expiré
 * resté dans le navigateur ferait refuser la demande par le serveur
 * (« Le type de jeton fourni n'est pas valide »), par exemple à la connexion.
 */
const ENDPOINTS_PUBLICS = [
  '/auth/connexion/',
  '/auth/refresh/',
  '/auth/inscription/',
  '/auth/creer-gie/',
  '/auth/verifier-otp/',
  '/auth/renvoyer-otp/',
  '/membres/membres/activation-compte/',
];

function estPublic(req: HttpRequest<unknown>): boolean {
  return ENDPOINTS_PUBLICS.some((chemin) => req.url.includes(chemin));
}

function avecJeton(req: HttpRequest<unknown>, jeton: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } });
}

/** Fin de session réelle : on efface tout, y compris l'utilisateur mémorisé. */
function terminerLaSession(): void {
  localStorage.removeItem(CLE_ACCESS);
  localStorage.removeItem(CLE_REFRESH);
  localStorage.removeItem(CLE_UTILISATEUR);
  window.location.href = '/login';
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);

  // Pages publiques : envoyées sans jeton, et jamais de renouvellement
  if (estPublic(req)) {
    return next(req);
  }

  const jetonUtilise = localStorage.getItem(CLE_ACCESS);
  const requeteAEnvoyer = jetonUtilise ? avecJeton(req, jetonUtilise) : req;

  return next(requeteAEnvoyer).pipe(
    catchError((error: HttpErrorResponse) => {

      // Seuls les 401 des requêtes ordinaires déclenchent un renouvellement
      // (jamais celui du renouvellement lui-même, ni la connexion)
      if (
        error.status !== 401
        || req.url.includes('/auth/refresh/')
        || req.url.includes('/auth/connexion/')
      ) {
        return throwError(() => error);
      }

      // Un autre appel a déjà renouvelé le jeton pendant que celle-ci
      // était en route : on la rejoue simplement avec le nouveau jeton.
      const jetonActuel = localStorage.getItem(CLE_ACCESS);
      if (jetonActuel && jetonActuel !== jetonUtilise) {
        return next(avecJeton(req, jetonActuel));
      }

      const refreshToken = localStorage.getItem(CLE_REFRESH);
      if (!refreshToken) {
        return throwError(() => error);
      }

      if (!renouvellementEnCours) {
        renouvellementEnCours = http
          .post<{ access: string; refresh?: string }>(
            `${environment.API_URL}auth/refresh/`,
            { refresh: refreshToken }
          )
          .pipe(
            map((reponse) => {
              localStorage.setItem(CLE_ACCESS, reponse.access);
              if (reponse.refresh) {
                localStorage.setItem(CLE_REFRESH, reponse.refresh);
              }
              return reponse.access;
            }),
            catchError((erreurRenouvellement) => {
              // Le jeton de renouvellement est réellement expiré ou révoqué
              console.error('Échec du renouvellement de la session :', erreurRenouvellement);
              terminerLaSession();
              return throwError(() => erreurRenouvellement);
            }),
            finalize(() => { renouvellementEnCours = null; }),
            shareReplay(1)
          );
      }

      // Les erreurs de la requête rejouée remontent normalement :
      // elles ne déconnectent pas l'utilisateur.
      return renouvellementEnCours.pipe(
        switchMap((nouveauJeton) => next(avecJeton(req, nouveauJeton)))
      );
    })
  );
};
