
"use client";

import { useEffect, useState, useRef, Dispatch, SetStateAction, KeyboardEvent } from 'react';
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
import { Pencil, Trash2, GanttChartSquare, Camera, Home, Building, LogIn } from 'lucide-react';
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
import { Badge } from './ui/badge';
import type { Employee, AccessLog } from '@/lib/types';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getEmployeesFromFirestore, addEmployeeToFirestore, updateEmployeeInFirestore, deleteEmployeeFromFirestore, addInitialEmployeesToFirestore } from '@/lib/firestoreService';


const emptyEmployee: Employee = {
    id: '',
    name: '',
    department: '',
    plate: '',
    ramal: '',
    status: 'Ativo',
    portaria: 'Nenhuma',
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

    const idInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const departmentInputRef = useRef<HTMLInputElement>(null);
    const plateInputRef = useRef<HTMLInputElement>(null);
    const ramalInputRef = useRef<HTMLInputElement>(null);
    const statusTriggerRef = useRef<HTMLButtonElement>(null);
    const portariaTriggerRef = useRef<HTMLButtonElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open) {
             // Reset with a unique ID when dialog opens
            setNewEmployee({...emptyEmployee, id: `func-${Date.now()}` });
            // Focus the first input when the dialog opens
            setTimeout(() => idInputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextFieldRef: React.RefObject<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextFieldRef.current?.focus();
        }
    };
    
    const handleSelectKeyDown = (e: KeyboardEvent<HTMLButtonElement>, nextFieldRef: React.RefObject<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextFieldRef.current?.focus();
        }
    }


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
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="id" className="text-right">Matrícula</Label>
                        <div className="col-span-3 flex items-center gap-2">
                           <Input ref={idInputRef} onKeyDown={(e) => handleKeyDown(e, nameInputRef)} id="id" value={newEmployee.id} onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})} className="flex-grow" />
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}>
                                <Camera className="h-4 w-4" />
                                <span className="sr-only">Ler código de barras</span>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input ref={nameInputRef} onKeyDown={(e) => handleKeyDown(e, departmentInputRef)} id="name" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">Setor</Label>
                        <Input ref={departmentInputRef} onKeyDown={(e) => handleKeyDown(e, plateInputRef)} id="department" value={newEmployee.department} onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plate" className="text-right">Placa</Label>
                        <Input ref={plateInputRef} onKeyDown={(e) => handleKeyDown(e, ramalInputRef)} id="plate" value={newEmployee.plate} onChange={(e) => setNewEmployee({...newEmployee, plate: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ramal" className="text-right">Ramal</Label>
                        <Input ref={ramalInputRef} onKeyDown={(e) => handleKeyDown(e, portariaTriggerRef as any)} id="ramal" value={newEmployee.ramal} onChange={(e) => setNewEmployee({...newEmployee, ramal: e.target.value})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="portaria" className="text-right">Portaria</Label>
                        <Select value={newEmployee.portaria} onValueChange={(value: 'Nenhuma' | 'P1' | 'P2') => setNewEmployee({...newEmployee, portaria: value})}>
                            <SelectTrigger ref={portariaTriggerRef} onKeyDown={(e) => handleSelectKeyDown(e, statusTriggerRef as any)} id="portaria" className="col-span-3">
                                <SelectValue placeholder="Selecione a portaria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="P1">P1</SelectItem>
                                <SelectItem value="P2">P2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={newEmployee.status} onValueChange={(value: 'Ativo' | 'Inativo') => setNewEmployee({...newEmployee, status: value})}>
                            <SelectTrigger ref={statusTriggerRef} onKeyDown={(e) => handleSelectKeyDown(e, saveButtonRef as any)} id="status" className="col-span-3">
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
                    <Button ref={saveButtonRef} type="submit" onClick={handleSaveClick}>Salvar</Button>
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

function EmployeeTable({ employees, setEmployees, isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen, accessLogs, setAccessLogs, role }: { employees: Employee[], setEmployees: (employees: Employee[]) => void, isAddEmployeeDialogOpen: boolean, setIsAddEmployeeDialogOpen: Dispatch<SetStateAction<boolean>>, accessLogs: AccessLog[], setAccessLogs: Dispatch<SetStateAction<AccessLog[]>>, role: 'rh' | 'portaria' }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [searchTerm, setInputValue] = useState('');
    const { toast } = useToast();
    const { user } = useAuth();
    
    const getRegisteredBy = (): 'RH' | 'P1' | 'P2' | 'Supervisor' => {
        if (!user) return 'P1'; // Should not happen
        if (user.role === 'rh') return 'RH';
        if (user.role === 'supervisor') return 'Supervisor';
        if (user.username === 'portaria1') return 'P1';
        if (user.username === 'portaria2') return 'P2';
        return 'P1'; // Default, should not happen
    }

    const handleManualEntry = (employee: Employee) => {
        if (!user) return;

        if (employee.status === 'Inativo') {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: `Funcionário ${employee.name} está inativo.` });
            return;
        }

        const openLog = accessLogs.find(
            log => log.personId === employee.id && log.exitTimestamp === null
        );

        const registeredBy = getRegisteredBy();

        if (openLog) {
            // Registering an exit
            const updatedLogs = accessLogs.map(log => 
                log.id === openLog.id 
                ? { ...log, exitTimestamp: new Date().toLocaleString('pt-BR'), registeredBy }
                : log
            );
            setAccessLogs(updatedLogs);
            toast({
                title: "Acesso Registrado: Saída",
                description: `${employee.name} - ${new Date().toLocaleString('pt-BR')}`,
                variant: 'destructive'
            });
        } else {
            // Registering an entry
            const newLog: AccessLog = {
                id: `log-${Date.now()}`,
                personId: employee.id,
                personName: employee.name,
                personType: 'employee',
                entryTimestamp: new Date().toLocaleString('pt-BR'),
                exitTimestamp: null,
                registeredBy,
            };
            setAccessLogs(prevLogs => [newLog, ...prevLogs]);
            toast({
                title: "Acesso Registrado: Entrada",
                description: `${employee.name} - ${newLog.entryTimestamp}`,
                variant: 'default'
            });
        }
    };

    const handleEditClick = (employee: Employee) => {
        setSelectedEmployee(JSON.parse(JSON.stringify(employee))); // Deep copy to avoid mutation
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = async (employeeId: string) => {
        try {
            await deleteEmployeeFromFirestore(employeeId);
            setEmployees(employees.filter(e => e.id !== employeeId));
            toast({ title: 'Funcionário excluído com sucesso!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir funcionário' });
            console.error(error);
        }
    };

    const handleSave = async () => {
        if (selectedEmployee) {
            try {
                await updateEmployeeInFirestore(selectedEmployee);
                setEmployees(employees.map(e => e.id === selectedEmployee.id ? selectedEmployee : e));
                setIsEditDialogOpen(false);
                setSelectedEmployee(null);
                toast({ title: 'Funcionário atualizado com sucesso!' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao atualizar funcionário' });
                console.error(error);
            }
        }
    };

    const handleAddNewEmployee = async (employee: Employee) => {
        try {
            await addEmployeeToFirestore(employee);
            setEmployees([employee, ...employees]);
            toast({ title: 'Funcionário adicionado com sucesso!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao adicionar funcionário' });
            console.error(error);
        }
    };

    const getPresenceStatus = (employeeId: string) => {
        const lastLog = accessLogs
            .filter(log => log.personId === employeeId && log.personType === 'employee')
            .sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime())[0];

        if (!lastLog || lastLog.exitTimestamp !== null) {
            return 'Fora';
        }
        return 'Dentro';
    };


    const filteredEmployees = employees.filter(employee => {
        const presenceStatus = getPresenceStatus(employee.id);
        const searchTermLower = searchTerm.toLowerCase();
        
        // If there's a search term, filter by it
        if (searchTermLower) {
            return (
                employee.id.toLowerCase().includes(searchTermLower) ||
                employee.name.toLowerCase().includes(searchTermLower) ||
                employee.department.toLowerCase().includes(searchTermLower) ||
                (employee.plate && employee.plate.toLowerCase().includes(searchTermLower)) ||
                (employee.ramal && employee.ramal.toLowerCase().includes(searchTermLower)) ||
                (employee.portaria && employee.portaria.toLowerCase().includes(searchTermLower)) ||
                employee.status.toLowerCase().includes(searchTermLower) ||
                presenceStatus.toLowerCase().includes(searchTermLower)
            );
        }
        
        // Otherwise, only show employees who are "Dentro"
        return presenceStatus === 'Dentro';
    });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Funcionários</CardTitle>
          <Link href="/employees/history">
            <Button variant="outline">
              <GanttChartSquare className="mr-2 h-4 w-4" />
              Ver Histórico
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
           <div className="flex items-center py-4">
            <Input
                placeholder="Filtrar funcionários..."
                value={searchTerm}
                onChange={(event) => setInputValue(event.target.value)}
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
                    <TableHead>Portaria</TableHead>
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
                    <TableCell>{employee.portaria && employee.portaria !== 'Nenhuma' ? employee.portaria : '-'}</TableCell>
                    <TableCell>
                        <Badge variant={employee.status === 'Ativo' ? 'default' : 'destructive'}>
                            {employee.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                         <Badge
                            variant={presence === 'Dentro' ? 'default' : 'destructive'}
                         >
                            {presence === 'Dentro' ? <Building className="mr-1 h-3 w-3" /> : <Home className="mr-1 h-3 w-3" />}
                            {presence}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleManualEntry(employee)} title="Registrar Entrada/Saída Manual">
                            <LogIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(employee)}>
                        <Pencil className="h-4 w-4" />
                        </Button>
                        {role === 'rh' && (
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
                        )}
                    </TableCell>
                    </TableRow>
                )})}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddEmployeeDialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen} onSave={handleAddNewEmployee} />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
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
                    <Label htmlFor="portaria-edit" className="text-right">Portaria</Label>
                    <Select value={selectedEmployee.portaria} onValueChange={(value: 'Nenhuma' | 'P1' | 'P2') => setSelectedEmployee({...selectedEmployee, portaria: value})}>
                        <SelectTrigger id="portaria-edit" className="col-span-3">
                            <SelectValue placeholder="Selecione a portaria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                            <SelectItem value="P1">P1</SelectItem>
                            <SelectItem value="P2">P2</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status-edit" className="text-right">Status</Label>
                    <Select disabled={role === 'portaria'} value={selectedEmployee.status} onValueChange={(value: 'Ativo' | 'Inativo') => setSelectedEmployee({...selectedEmployee, status: value})}>
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

export function EmployeeDashboard({ role = 'rh', isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen, accessLogs, setAccessLogs }: { role: 'rh' | 'portaria', isAddEmployeeDialogOpen: boolean, setIsAddEmployeeDialogOpen: Dispatch<SetStateAction<boolean>>, accessLogs: AccessLog[], setAccessLogs: Dispatch<SetStateAction<AccessLog[]>> }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeData = async () => {
            try {
                let firestoreEmployees = await getEmployeesFromFirestore();

                if (firestoreEmployees.length === 0) {
                    toast({ title: "Configurando...", description: "Adicionando funcionários iniciais ao banco de dados." });
                    await addInitialEmployeesToFirestore();
                    firestoreEmployees = await getEmployeesFromFirestore(); // Fetch again after adding
                }
                
                setEmployees(firestoreEmployees);

            } catch (error) {
                console.error("Error during data initialization:", error);
                toast({ variant: 'destructive', title: 'Erro de Dados', description: 'Não foi possível carregar os dados dos funcionários.' });
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [toast]);


  return (
    <div className="container mx-auto">
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <p>Carregando funcionários...</p>
            </div>
        ) : (
            <EmployeeTable 
                employees={employees} 
                setEmployees={setEmployees} 
                isAddEmployeeDialogOpen={isAddEmployeeDialogOpen}
                setIsAddEmployeeDialogOpen={setIsAddEmployeeDialogOpen}
                accessLogs={accessLogs}
                setAccessLogs={setAccessLogs}
                role={role}
            />
        )}
    </div>
  );
}
