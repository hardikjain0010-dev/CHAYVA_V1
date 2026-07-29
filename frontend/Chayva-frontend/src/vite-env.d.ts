/// <reference types="vite/client" />

declare module "*.css";

declare namespace google.accounts.id {
  type CredentialResponse = {
    credential: string;
    select_by?: string;
  };
}
