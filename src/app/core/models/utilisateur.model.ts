export type Role = 'administrateur' | 'president' | 'tresorier' | 'secretaire' | 'membre_simple';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  role: Role;
  idGie?: string;        // ← l'API retourne le nom du GIE, pas idGie
  email?: string;
   codePin: string,
}

export interface ReponseLogin {
  message: string;
  tokens: {
    access: string;
    refresh: string;
  };
  utilisateur: Utilisateur;  // ← "utilisateur" pas "user"
}
