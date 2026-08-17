import { apiRequest } from "./http";

export interface RosterEntry {
  nombre: string;
  email: string;
  grupo: number;
}

export function getRosterEntry(email: string) {
  return apiRequest<RosterEntry>("roster", { query: { email } });
}
