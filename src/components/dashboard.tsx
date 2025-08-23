
"use client";

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from './ui/button';
import { Pencil, Trash2, PlusCircle, Camera, LogIn, LogOut, Home, Building, User, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Html5Qrcode } from 'html5-qrcode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import type { Employee, Visitor, AccessLog } from '@/lib/types';


const initialEmployees: Employee[] = [
  { id: '1', name: 'João da Silva', department: 'Produção', plate: 'ABC-1234', ramal: '2101', status: 'Ativo' },
  { id: '2', name: 'Maria Oliveira', department: 'Logística', plate: 'DEF-5678', ramal: '2102', status: 'Ativo' },
  { id: '3', name: 'Pedro Souza', department: 'Administrativo', plate: 'GHI-9012', ramal: '2103', status: 'Inativo' },
];

const emptyEmployee: Employee = {
    id: '',
    name: '',
    department: '',
    plate: '',
    ramal: '',
    status: 'Ativo',
};

const emptyVisitor: Visitor = {
    id: '',
    name: '',
    document: '',
    company: '',
};

function BarcodeScannerDialog({ open, onOpenChange, onBarcodeScan }: { open: boolean; onOpenChange: (open: boolean) => void; onBarcodeScan: (barcode: string) => void; }) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const cleanupCalledRef = useRef(false);

  useEffect(() => {
    if (open) {
      cleanupCalledRef.current = false; // Reset on open
      Html5Qrcode.getCameras().then(availableDevices => {
        if (availableDevices && availableDevices.length > 0) {
          setDevices(availableDevices);
          if(!selectedDeviceId) {
            setSelectedDeviceId(availableDevices[0].id);
          }
        } else {
            toast({ variant: "destructive", title: "Nenhuma câmera encontrada."})
        }
      }).catch(err => {
        console.error("Error getting cameras:", err);
        toast({ variant: "destructive", title: "Erro ao acessar câmeras.", description: "Por favor, verifique as permissões."})
      });
    }
  }, [open, toast, selectedDeviceId]);


  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
            console.warn("Scanner could not be stopped, likely already stopped.", err);
        });
    }
  };

  useEffect(() => {
    if (open && selectedDeviceId && readerRef.current) {
        // Ensure the div is ready.
        if (!readerRef.current) return;

        // Initialize scanner if it doesn't exist
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(readerRef.current.id, { verbose: false });
        }
        const html5Qrcode = scannerRef.current;
        
        const qrCodeSuccessCallback = (decodedText: string) => {
            onBarcodeScan(decodedText);
            onOpenChange(false); // Close dialog on successful scan
        };
        
        if (html5Qrcode && !html5Qrcode.isScanning) {
            html5Qrcode.start(
                selectedDeviceId, 
                {
                    fps: 10,
                    qrbox: { width: 350, height: 150 }
                },
                qrCodeSuccessCallback,
                () => {} // Ignore errors
            ).catch(err => {
                console.error("Unable to start scanning.", err);
            });
        }
    }

    return () => {
        if (!cleanupCalledRef.current) {
             cleanupCalledRef.current = true;
             stopScanner();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDeviceId]);

  const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
          stopScanner();
      }
      onOpenChange(isOpen);
  };

  return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                  <DialogTitle>Leitor de Código de Barras</DialogTitle>
                  <DialogDescription>
                      Selecione a câmera e aponte para o código de barras.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {devices.length > 1 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="camera-select" className="text-right">Câmera</Label>
                        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                            <SelectTrigger id="camera-select" className="col-span-3">
                                <SelectValue placeholder="Selecione uma câmera" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map(device => (
                                    <SelectItem key={device.id} value={device.id}>
                                        {device.label || `Câmera ${devices.indexOf(device) + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 )}
                <div id="reader-dialog" ref={readerRef} className="w-full aspect-video rounded-md bg-black" />
              </div>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  )
}

function AddEmployeeDialog({ open, onOpenChange, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (employee: Employee) => void }) {
    const { toast } = useToast();
    const [newEmployee, setNewEmployee] = useState(emptyEmployee);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    useEffect(() => {
        if (open) {
             // Reset with a unique ID when dialog opens
            setNewEmployee({...emptyEmployee, id: `func-${Date.now()}` });
        }
    }, [open]);

    const handleSaveClick = () => {
        if (!newEmployee.name || !newEmployee.department) {
             toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Nome e Setor precisam ser preenchidos.',
            });
            return;
        }
        onSave(newEmployee);
        onOpenChange(false);
    }
    
    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
                    <DialogDescription>
                       Preencha os dados abaixo para cadastrar um novo funcionário.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="id" className="text-right">Matrícula</Label>
                        <div className="col-span-3 flex items-center gap-2">
                           <Input id="id" value={newEmployee.id} onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})} className="flex-grow" />
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}>
                                <Camera className="h-4 w-4" />
                                <span className="sr-only">Ler código de barras</span>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">Setor</Label>
                        <Input id="department" value={newEmployee.department} onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plate" className="text-right">Placa</Label>
                        <Input id="plate" value={newEmployee.plate} onChange={(e) => setNewEmployee({...newEmployee, plate: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ramal" className="text-right">Ramal</Label>
                        <Input id="ramal" value={newEmployee.ramal} onChange={(e) => setNewEmployee({...newEmployee, ramal: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={newEmployee.status} onValueChange={(value: 'Ativo' | 'Inativo') => setNewEmployee({...newEmployee, status: value})}>
                            <SelectTrigger id="status" className="col-span-3">
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ativo">Ativo</SelectItem>
                                <SelectItem value="Inativo">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                     <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSaveClick}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <BarcodeScannerDialog
             open={isScannerOpen}
             onOpenChange={setIsScannerOpen}
             onBarcodeScan={(barcode) => {
                 setNewEmployee(prev => ({ ...prev, id: barcode }));
                 toast({ title: "Matrícula preenchida!" });
             }}
         />
        </>
    )
}

function EmployeeTable({ employees, setEmployees, accessLogs }: { employees: Employee[], setEmployees: (employees: Employee[]) => void, accessLogs: AccessLog[] }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEditClick = (employee: Employee) => {
        setSelectedEmployee(JSON.parse(JSON.stringify(employee))); // Deep copy to avoid mutation
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (employeeId: string) => {
        setEmployees(employees.filter(e => e.id !== employeeId));
    };

    const handleSave = () => {
        if (selectedEmployee) {
          setEmployees(employees.map(e => e.id === selectedEmployee.id ? selectedEmployee : e));
        }
        setIsEditDialogOpen(false);
        setSelectedEmployee(null);
    };

    const handleAddNewEmployee = (employee: Employee) => {
        setEmployees([employee, ...employees]);
    };

    const getPresenceStatus = (employeeId: string) => {
        const employeeLogs = accessLogs
            .filter(log => log.personId === employeeId && log.personType === 'employee')
            .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

        const lastLog = employeeLogs[0];
        if (!lastLog || lastLog.type === 'Saída') {
            return 'Fora';
        }
        return 'Dentro';
    };

    const filteredEmployees = employees.filter(employee => {
        const presenceStatus = getPresenceStatus(employee.id);
        const searchTermLower = searchTerm.toLowerCase();

        return (
            employee.id.toLowerCase().includes(searchTermLower) ||
            employee.name.toLowerCase().includes(searchTermLower) ||
            employee.department.toLowerCase().includes(searchTermLower) ||
            (employee.plate && employee.plate.toLowerCase().includes(searchTermLower)) ||
            (employee.ramal && employee.ramal.toLowerCase().includes(searchTermLower)) ||
            employee.status.toLowerCase().includes(searchTermLower) ||
            presenceStatus.toLowerCase().includes(searchTermLower)
        );
    });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Funcionários</CardTitle>
           <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar Funcionário
            </Button>
        </CardHeader>
        <CardContent>
           <div className="flex items-center py-4">
            <Input
                placeholder="Filtrar funcionários..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Ramal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Presença</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredEmployees.map((employee) => {
                    const presence = getPresenceStatus(employee.id);
                    return (
                    <TableRow key={employee.id}>
                    <TableCell>{employee.id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.plate}</TableCell>
                    <TableCell>{employee.ramal}</TableCell>
                    <TableCell>
                        <Badge variant={employee.status === 'Ativo' ? 'default' : 'destructive'}>
                            {employee.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                         <Badge variant={presence === 'Dentro' ? 'default' : 'secondary'}>
                            {presence === 'Dentro' ? <Building className="mr-1 h-3 w-3" /> : <Home className="mr-1 h-3 w-3" />}
                            {presence}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(employee)}>
                        <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá apagar permanentemente o funcionário.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(employee.id)}>Apagar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                )})}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddEmployeeDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSave={handleAddNewEmployee} />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Altere os dados do funcionário. Clique em salvar para aplicar as mudanças.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
             <div className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="id-edit" className="text-right">Matrícula</Label>
                  <Input id="id-edit" value={selectedEmployee.id} className="col-span-3" disabled />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name-edit" className="text-right">Nome</Label>
                  <Input id="name-edit" value={selectedEmployee.name} onChange={(e) => setSelectedEmployee({...selectedEmployee, name: e.target.value})} className="col-span-3" />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department-edit" className="text-right">Setor</Label>
                  <Input id="department-edit" value={selectedEmployee.department} onChange={(e) => setSelectedEmployee({...selectedEmployee, department: e.target.value})} className="col-span-3" />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plate-edit" className="text-right">Placa</Label>
                  <Input id="plate-edit" value={selectedEmployee.plate} onChange={(e) => setSelectedEmployee({...selectedEmployee, plate: e.target.value})} className="col-span-3" />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ramal-edit" className="text-right">Ramal</Label>
                  <Input id="ramal-edit" value={selectedEmployee.ramal} onChange={(e) => setSelectedEmployee({...selectedEmployee, ramal: e.target.value})} className="col-span-3" />
               </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status-edit" className="text-right">Status</Label>
                    <Select value={selectedEmployee.status} onValueChange={(value: 'Ativo' | 'Inativo') => setSelectedEmployee({...selectedEmployee, status: value})}>
                        <SelectTrigger id="status-edit" className="col-span-3">
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VisitorTable({ visitors, setVisitors, accessLogs }: { visitors: Visitor[], setVisitors: (visitors: Visitor[]) => void, accessLogs: AccessLog[] }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const handleEditClick = (visitor: Visitor) => {
        setSelectedVisitor(JSON.parse(JSON.stringify(visitor))); // Deep copy
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (visitorId: string) => {
        setVisitors(visitors.filter(v => v.id !== visitorId));
    };

    const handleSave = () => {
        if (selectedVisitor) {
            setVisitors(visitors.map(v => v.id === selectedVisitor.id ? selectedVisitor : v));
        }
        setIsEditDialogOpen(false);
        setSelectedVisitor(null);
    };

    const handleAddNewVisitor = (visitor: Visitor) => {
        if (!visitor.name || !visitor.document) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome e Documento são obrigatórios.' });
            return;
        }
        setVisitors([visitor, ...visitors]);
        setIsAddDialogOpen(false);
    };
    
    const getPresenceStatus = (visitorId: string) => {
        const visitorLogs = accessLogs
            .filter(log => log.personId === visitorId && log.personType === 'visitor')
            .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

        const lastLog = visitorLogs[0];
        if (!lastLog || lastLog.type === 'Saída') {
            return 'Fora';
        }
        return 'Dentro';
    };

    const filteredVisitors = visitors.filter(visitor => {
        const presenceStatus = getPresenceStatus(visitor.id);
        const searchTermLower = searchTerm.toLowerCase();

        return (
            visitor.id.toLowerCase().includes(searchTermLower) ||
            visitor.name.toLowerCase().includes(searchTermLower) ||
            visitor.document.toLowerCase().includes(searchTermLower) ||
            visitor.company.toLowerCase().includes(searchTermLower) ||
            presenceStatus.toLowerCase().includes(searchTermLower)
        );
    });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visitantes</CardTitle>
           <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar Visitante
            </Button>
        </CardHeader>
        <CardContent>
           <div className="flex items-center py-4">
            <Input
                placeholder="Filtrar visitantes..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Presença</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredVisitors.map((visitor) => {
                    const presence = getPresenceStatus(visitor.id);
                    return (
                    <TableRow key={visitor.id}>
                    <TableCell>{visitor.id}</TableCell>
                    <TableCell>{visitor.name}</TableCell>
                    <TableCell>{visitor.document}</TableCell>
                    <TableCell>{visitor.company}</TableCell>
                     <TableCell>
                         <Badge variant={presence === 'Dentro' ? 'default' : 'secondary'}>
                            {presence === 'Dentro' ? <Building className="mr-1 h-3 w-3" /> : <Home className="mr-1 h-3 w-3" />}
                            {presence}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(visitor)}>
                        <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá apagar permanentemente o visitante.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(visitor.id)}>Apagar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                )})}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Cadastrar Novo Visitante</DialogTitle>
              </DialogHeader>
              <AddVisitorForm onSave={handleAddNewVisitor} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Editar Visitante</DialogTitle>
              </DialogHeader>
              {selectedVisitor && <AddVisitorForm
                initialData={selectedVisitor}
                onSave={(visitor) => {
                  handleSave();
                  // A bit of a hack to update the selected visitor state
                  // since the form is now self-contained
                  setVisitors(visitors.map(v => v.id === visitor.id ? visitor : v));
                  setIsEditDialogOpen(false);
                }}
                onCancel={() => setIsEditDialogOpen(false)}
              />}
          </DialogContent>
      </Dialog>

    </>
  );
}

function AddVisitorForm({ onSave, onCancel, initialData }: { onSave: (visitor: Visitor) => void, onCancel: () => void, initialData?: Visitor }) {
    const [visitor, setVisitor] = useState(initialData || { ...emptyVisitor, id: `visit-${Date.now()}` });
    const { toast } = useToast();

    const handleSave = () => {
         if (!visitor.name || !visitor.document) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome e Documento são obrigatórios.' });
            return;
        }
        onSave(visitor);
    };

    return (
        <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id-visitor" className="text-right">ID</Label>
                <Input id="id-visitor" value={visitor.id} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name-visitor" className="text-right">Nome</Label>
                <Input id="name-visitor" value={visitor.name} onChange={(e) => setVisitor({ ...visitor, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="document-visitor" className="text-right">Documento</Label>
                <Input id="document-visitor" value={visitor.document} onChange={(e) => setVisitor({ ...visitor, document: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company-visitor" className="text-right">Empresa</Label>
                <Input id="company-visitor" value={visitor.company} onChange={(e) => setVisitor({ ...visitor, company: e.target.value })} className="col-span-3" />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
        </div>
    );
}

export function Dashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

    // Load employees from localStorage on initial render
    useEffect(() => {
        try {
            const storedEmployees = localStorage.getItem('employees');
            if (storedEmployees) {
                setEmployees(JSON.parse(storedEmployees));
            } else {
                setEmployees(initialEmployees);
            }
        } catch (error) {
            console.error("Error reading employees from localStorage", error);
            setEmployees(initialEmployees);
        }
    }, []);

    // Save employees to localStorage whenever they change
    useEffect(() => {
        try {
             if (employees.length > 0) { 
                localStorage.setItem('employees', JSON.stringify(employees));
            }
        } catch (error) {
            console.error("Error writing employees to localStorage", error);
        }
    }, [employees]);

     // Load visitors from localStorage on initial render
    useEffect(() => {
        try {
            const storedVisitors = localStorage.getItem('visitors');
            if (storedVisitors) {
                setVisitors(JSON.parse(storedVisitors));
            }
        } catch (error) {
            console.error("Error reading visitors from localStorage", error);
        }
    }, []);

    // Save visitors to localStorage whenever they change
    useEffect(() => {
        try {
            if (visitors.length > 0) {
                localStorage.setItem('visitors', JSON.stringify(visitors));
            }
        } catch (error) {
            console.error("Error writing visitors to localStorage", error);
        }
    }, [visitors]);

    // Load access logs from localStorage on initial render
     useEffect(() => {
        try {
            const storedLogs = localStorage.getItem('accessLogs');
            if (storedLogs) {
                setAccessLogs(JSON.parse(storedLogs));
            }
        } catch (error) {
            console.error("Error reading access logs from localStorage", error);
        }
    }, []);

    // Save access logs to localStorage whenever they change
    useEffect(() => {
        try {
            // Do not save empty array if it was just initialized
            if (accessLogs.length > 0) {
              localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
            }
        } catch (error) {
            console.error("Error writing access logs to localStorage", error);
        }
    }, [accessLogs]);

  return (
    <div className="container mx-auto">
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
            <TabsTrigger value="visitors">Visitantes</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="mt-6">
            <EmployeeTable employees={employees} setEmployees={setEmployees} accessLogs={accessLogs} />
        </TabsContent>
        <TabsContent value="visitors" className="mt-6">
            <VisitorTable visitors={visitors} setVisitors={setVisitors} accessLogs={accessLogs} />
        </TabsContent>
    </Tabs>
    </div>
  );
}
