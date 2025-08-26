
export interface Employee {
  id: string;
  name: string;
  department: string;
  plate: string;
  ramal: string;
  status: 'Ativo' | 'Inativo';
  portaria?: 'Nenhuma' | 'P1' | 'P2';
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

export interface Car {
  id: string; // Plate number
  fleet: string;
  status: 'Disponível' | 'Em uso' | 'Manutenção';
  lastDriverName?: string;
  lastKm?: string;
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

export interface CarLog {
  id: string;
  carId: string; // Plate number
  carFleet: string;
  driverName: string;
  returnDriverName?: string;
  startTime: string;
  endTime: string | null;
  startKm?: string;
  endKm?: string;
}

export interface User {
    id: string;
    username: string;
    role: 'rh' | 'portaria';
}
