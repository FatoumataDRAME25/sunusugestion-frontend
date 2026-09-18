// separer du model de l'utilisateur dans core du fait que ce model n'utilise que deux champs de ce model

export interface LoginCredentials {
  identifiant: string;
  codePin: string;
}
