
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
    name: string;
    document: string;
    company: string;
}

export interface AccessLog {
  id: string;
  personName: string;
  personId: string;
  personType: 'employee' | 'visitor';
  timestamp: string;
  type: 'Entrada' | 'Saída';
}
