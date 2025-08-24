
export interface Employee {
  id: string;
  name: string;
  department: string;
  plate: string;
  ramal: string;
  status: 'Ativo' | 'Inativo';
}

export interface Visitor {
    id: string;
    photoDataUrl: string;
    name: string;
    rg: string;
    cpf: string;
    company?: string;
    plate?: string;
    responsible: string;
    reason: string;
}

export interface AccessLog {
  id: string;
  personName: string;
  personId: string;
  personType: 'employee' | 'visitor';
  entryTimestamp: string;
  exitTimestamp: string | null;
  // For visitors, capture the reason for this specific visit
  reason?: string; 
  responsible?: string;
  // Snapshot of visitor details at the time of entry
  photoDataUrl?: string;
  rg?: string;
  cpf?: string;
  company?: string;
  plate?: string;
}
