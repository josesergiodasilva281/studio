
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
import { Pencil, Trash2, PlusCircle, Camera, LogIn, LogOut } from 'lucide-react';
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


interface Employee {
  id: string;
  name: string;
  department: string;
  plate: string;
  ramal: string;
  status: 'Ativo' | 'Inativo';
}

interface AccessLog {
  id: string;
  employeeName: string;
  employeeId: string;
  timestamp: string;
  type: 'Entrada' | 'Saída';
}

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

function BarcodeScannerDialog({ open, onOpenChange, onBarcodeScan }: { open: boolean; onOpenChange: (open: boolean) => void; onBarcodeScan: (barcode: string) => void; }) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const cleanupCalledRef = useRef(false);

  useEffect(() => {
    if (open) {
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
            console.error("Failed to stop scanner:", err);
        });
    }
  };

  useEffect(() => {
    if (open && selectedDeviceId && readerRef.current) {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(readerRef.current.id);
        }
        const html5Qrcode = scannerRef.current;
        
        const qrCodeSuccessCallback = (decodedText: string) => {
            onBarcodeScan(decodedText);
            onOpenChange(false);
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
                toast({ variant: "destructive", title: "Falha ao iniciar a câmera", description: "Verifique as permissões e tente novamente."})
                onOpenChange(false);
            });
        }
    }

    // Cleanup function
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

function EmployeeTable({ employees, setEmployees }: { employees: Employee[], setEmployees: (employees: Employee[]) => void }) {
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

    const filteredEmployees = employees.filter(employee =>
        employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.plate && employee.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.ramal && employee.ramal.toLowerCase().includes(searchTerm.toLowerCase())) ||
        employee.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredEmployees.map((employee) => (
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
                ))}
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

function AccessControl({ employees, accessLogs, setAccessLogs }: { employees: Employee[], accessLogs: AccessLog[], setAccessLogs: (logs: AccessLog[]) => void }) {
    const { toast } = useToast();
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerRef = useRef<HTMLDivElement>(null);
    const [isScannerPaused, setIsScannerPaused] = useState(false);
    const cleanupCalledRef = useRef(false);

    useEffect(() => {
        Html5Qrcode.getCameras().then(availableDevices => {
            if (availableDevices && availableDevices.length > 0) {
                setDevices(availableDevices);
                if (!selectedDeviceId) {
                    setSelectedDeviceId(availableDevices[0].id);
                }
            } else {
                 toast({ variant: "destructive", title: "Nenhuma câmera encontrada." });
            }
        }).catch(err => {
            console.error("Error getting cameras:", err);
            toast({ variant: "destructive", title: "Erro ao acessar câmeras.", description: "Por favor, verifique as permissões." });
        });
    }, [selectedDeviceId, toast]);

    const stopScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => {
                console.error("Failed to stop scanner:", err);
            });
        }
    };
    
    const handleScanSuccess = (decodedText: string) => {
        if (isScannerPaused) return;

        setIsScannerPaused(true);

        const employee = employees.find(e => e.id === decodedText);

        if (!employee) {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Funcionário não encontrado.' });
        } else if (employee.status === 'Inativo') {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: `Funcionário ${employee.name} está inativo.` });
        } else {
            const employeeLogs = accessLogs
                .filter(log => log.employeeId === employee.id)
                .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

            const lastLog = employeeLogs[0];
            const newLogType = !lastLog || lastLog.type === 'Saída' ? 'Entrada' : 'Saída';
            
            const newLog: AccessLog = {
                id: new Date().toISOString(),
                employeeId: employee.id,
                employeeName: employee.name,
                timestamp: new Date().toLocaleString('pt-BR'),
                type: newLogType,
            };

            setAccessLogs([newLog, ...accessLogs]);
            toast({
                title: `Acesso Registrado: ${newLogType}`,
                description: `${employee.name} - ${newLog.timestamp}`,
                variant: newLogType === 'Entrada' ? 'default' : 'destructive'
            });
        }
        
        // Pause for 2 seconds to avoid multiple scans
        setTimeout(() => setIsScannerPaused(false), 2000);
    };

    useEffect(() => {
        if (selectedDeviceId && readerRef.current) {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(readerRef.current.id, {
                    verbose: false
                });
            }
            const html5Qrcode = scannerRef.current;

            if (html5Qrcode && !html5Qrcode.isScanning) {
                html5Qrcode.start(
                    selectedDeviceId,
                    {
                        fps: 5,
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            const qrboxSize = Math.floor(minEdge * 0.8);
                            return { width: qrboxSize, height: qrboxSize };
                        },
                    },
                    handleScanSuccess,
                    () => { /* ignore errors */ }
                ).catch((err) => {
                    console.error("Unable to start scanning.", err);
                    toast({ variant: "destructive", title: "Falha ao iniciar a câmera", description: "Verifique as permissões e tente novamente." });
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
    }, [selectedDeviceId, employees, accessLogs]);

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Controle de Acesso</CardTitle>
                    <CardDescription>Aponte o código de barras do funcionário para a câmera para registrar a entrada ou saída.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                     {devices.length > 1 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="camera-select-main" className="text-right">Câmera</Label>
                            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                                <SelectTrigger id="camera-select-main" className="col-span-3">
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
                    <div id="reader-main" ref={readerRef} className="w-full aspect-square rounded-md bg-black overflow-hidden" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Últimos Acessos</CardTitle>
                    <CardDescription>Histórico de entradas e saídas recentes.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Funcionário</TableHead>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead className="text-right">Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accessLogs.slice(0, 10).map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.employeeName}</TableCell>
                                    <TableCell>{log.timestamp}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={log.type === 'Entrada' ? 'default' : 'secondary'}>
                                            {log.type === 'Entrada' ? <LogIn className="mr-1 h-3 w-3" /> : <LogOut className="mr-1 h-3 w-3" />}
                                            {log.type}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export function Dashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
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
            <TabsTrigger value="access-control">Histórico de Funcionário</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="mt-6">
            <EmployeeTable employees={employees} setEmployees={setEmployees} />
        </TabsContent>
        <TabsContent value="access-control" className="mt-6">
            <AccessControl employees={employees} accessLogs={accessLogs} setAccessLogs={setAccessLogs} />
        </TabsContent>
    </Tabs>
    </div>
  );
}
