import { HttpInterceptorFn, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('sunugestion_access');
  const http = inject(HttpClient);

  let requeteAEnvoyer = req;

  if (token) {
    requeteAEnvoyer = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(requeteAEnvoyer).pipe(
    catchError((error: HttpErrorResponse) => {

      // On intercepte le 401, SANS intercepter la route /refresh/ elle-même
      if (error.status === 401 && !req.url.includes('/api/auth/refresh/')) {
        const refreshToken = localStorage.getItem('sunugestion_refresh');

        if (refreshToken) {
          // On appelle l'URL qu'on vient de créer dans Django
          return http.post<any>('http://127.0.0.1:8000/api/auth/refresh/', { refresh: refreshToken }).pipe(
            switchMap((response) => {
              localStorage.setItem('sunugestion_access', response.access);
              if (response.refresh) {
                localStorage.setItem('sunugestion_refresh', response.refresh);
              }

              const nouvelleRequete = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.access}`
                }
              });
              return next(nouvelleRequete);
            }),
            catchError((refreshError) => {
               // 🔍 AJOUTEZ CES LOGS POUR VOIR LE PROBLÈME DANS LA CONSOLE F12 :
              console.error("Échec du rafraîchissement automatique du jeton !");
              console.error("Détail technique de l'erreur de rafraîchissement :", refreshError);
              // Nettoyage automatique en cas d'expiration des 30 jours
              localStorage.removeItem('sunugestion_access');
              localStorage.removeItem('sunugestion_refresh');
              window.location.href = '/login';
              return throwError(() => refreshError);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
