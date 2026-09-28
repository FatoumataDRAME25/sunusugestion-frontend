import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private http    = inject(HttpClient);
  private router  = inject(Router);

  private app;
  private messaging;

  private readonly vapidKey = 'BCl14kMpN7uP2742lDywZDHeWLGZ9IKkpMi56vyeLc1KgIva2JaIieyHjs8ibrfG9nAH78Xe5rL_M7paX9j5C6Y';
  private readonly BASE_URL = environment.API_URL;

  constructor() {
    this.app      = initializeApp(environment.firebase);
    this.messaging = getMessaging(this.app);
  }

  // ─── Demande permission + token ───────────────────────────────────────────

  /** Demande la permission, récupère le token FCM et l'enregistre côté Django. */
  async demanderPermission(): Promise<string | null> {
    console.log('🔥 demanderPermission() appelée');

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission :', permission);

      if (permission !== 'granted') {
        return null;
      }

      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      );

      console.log('📋 SW enregistré, scope :', registration.scope);

      const activeRegistration = await navigator.serviceWorker.ready;

      console.log('✅ SW activé');

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: activeRegistration
      });

      console.log('🎫 Token FCM :', token);

      if (token) {
        await this.enregistrerToken(token);
      }

      // Activer l'écoute des messages foreground
      this.ecouterMessagesForeground();

      return token;

    } catch (error) {
      console.error('❌ Erreur FCM :', error);
      return null;
    }
  }

  // ─── Foreground ───────────────────────────────────────────────────────────

  /**
   * Écoute les messages FCM lorsque l'application est au premier plan.
   * Affiche une notification via new Notification() et gère la navigation
   * Angular directement au clic grâce au Router.
   */
  private ecouterMessagesForeground(): void {
    onMessage(this.messaging, (payload) => {
      console.log('📩 Message FCM foreground reçu :', payload);

      const title  = payload.notification?.title || 'SunuGestion';
      const body   = payload.notification?.body  || 'Vous avez une nouvelle notification.';
      const data   = payload.data || {};

      if (Notification.permission !== 'granted') return;

      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico'
      });

      // Navigation Angular au clic — le Router est disponible dans ce contexte
      notif.onclick = (event) => {
        event.preventDefault();
        notif.close();

        const route = this._construireRoute(data['module'], data['objet_id']);
        console.log('🔗 Navigation foreground vers :', route);
        this.router.navigate([route]);
      };
    });
  }

  // ─── Construction de la route ─────────────────────────────────────────────

  /**
   * Construit la route Angular à partir du module et de l'objet_id FCM.
   * Utilise uniquement les routes réellement présentes dans app.routes.ts.
   */
  private _construireRoute(module?: string, objetId?: string): string {
    switch (module) {
      case 'activites':
        return objetId
          ? `/mon-espace/activites/${objetId}`
          : '/mon-espace/activites';

      case 'prets':
        return objetId
          ? `/mon-espace/prets/${objetId}`
          : '/mon-espace/prets';

      case 'cotisations':
        return '/mon-espace/cotisations';

      case 'membres':
        return '/mon-espace/membres';

      case 'general':
      default:
        return '/mon-espace';
    }
  }

  // ─── Enregistrement token ─────────────────────────────────────────────────

  /**
   * Envoie le token FCM au backend Django.
   * L'intercepteur JWT ajoute automatiquement le Bearer token.
   * Les erreurs sont silencieuses pour ne pas bloquer la connexion.
   */
  private async enregistrerToken(token: string): Promise<void> {
    const appareil = `${this._detecterNavigateur()} - ${this._detecterPlateforme()}`;

    try {
      await firstValueFrom(
        this.http.post(
          `${this.BASE_URL}notifications/fcm-token/`,
          { token, appareil }
        )
      );

      console.log('📡 Token FCM envoyé au backend :', appareil);
    } catch (error) {
      console.warn('⚠️ Impossible d\'enregistrer le token FCM côté backend :', error);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _detecterNavigateur(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg'))     return 'Edge';
    if (ua.includes('Chrome'))  return 'Chrome';
    if (ua.includes('Safari'))  return 'Safari';
    return 'Navigateur';
  }

  private _detecterPlateforme(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Android'))                      return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Win'))                          return 'PC';
    if (ua.includes('Mac'))                          return 'Mac';
    if (ua.includes('Linux'))                        return 'Linux';
    return 'Appareil';
  }
}
