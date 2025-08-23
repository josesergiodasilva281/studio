
"use client";

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Pencil, Trash2, PlusCircle, Camera } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Employee {
  id: string;
  name: string;
  department: string;
  plate: string;
  ramal: string;
}

const initialEmployees: Employee[] = [
  { id: '1', name: 'João da Silva', department: 'Produção', plate: 'ABC-1234', ramal: '2101' },
  { id: '2', name: 'Maria Oliveira', department: 'Logística', plate: 'DEF-5678', ramal: '2102' },
  { id: '3', name: 'Pedro Souza', department: 'Administrativo', plate: 'GHI-9012', ramal: '2103' },
];

const emptyEmployee: Employee = {
    id: '',
    name: '',
    department: '',
    plate: '',
    ramal: '',
};

function BarcodeScannerDialog({ open, onOpenChange, onBarcodeScan }: { open: boolean; onOpenChange: (open: boolean) => void; onBarcodeScan: (barcode: string) => void; }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getDevices = async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            console.warn("enumerateDevices() not supported.");
            return;
        }
        try {
            await navigator.mediaDevices.getUserMedia({ video: true }); // Prompt for permission first
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error("Error enumerating devices:", err);
            setHasCameraPermission(false);
        }
    };

    if (open) {
        getDevices();
    }

  }, [open]);
  
  const stopCamera = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
  };

  useEffect(() => {
    let animationFrameId: number;

    const detectBarcode = async () => {
        if (!('BarcodeDetector' in window)) {
            toast({
                variant: 'destructive',
                title: 'Navegador não suportado',
                description: 'A leitura de código de barras não é suportada neste navegador.',
            });
            onOpenChange(false);
            return;
        }
        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'codabar', 'code_128', 'qr_code'] });
        
        const detect = async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                    const barcodes = await barcodeDetector.detect(videoRef.current);
                    if (barcodes.length > 0) {
                        onBarcodeScan(barcodes[0].rawValue);
                        toast({
                            title: "Código de Barras Lido!",
                            description: `Valor: ${barcodes[0].rawValue}`,
                        });
                        onOpenChange(false); // Close dialog on successful scan
                    } else {
                        animationFrameId = requestAnimationFrame(detect);
                    }
                } catch (error) {
                    console.error('Barcode detection failed:', error);
                    animationFrameId = requestAnimationFrame(detect);
                }
            } else {
                 animationFrameId = requestAnimationFrame(detect);
            }
        };
        
        if(open && hasCameraPermission) {
            detect();
        }
    };

    const startCamera = async () => {
        stopCamera(); // Stop any existing stream
        if (selectedDeviceId) {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera not available');
                }
                const constraints = {
                    video: { deviceId: { exact: selectedDeviceId } }
                };
                streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    await videoRef.current.play().catch(err => {
                        console.error("Video play interrupted:", err);
                    });
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Acesso à Câmera Negado',
                    description: 'Por favor, habilite a permissão da câmera no seu navegador.',
                });
                onOpenChange(false);
            }
        }
    };

    if (open && selectedDeviceId) {
        startCamera();
        detectBarcode();
    }
    
    // Cleanup function
    return () => {
        stopCamera();
        if(animationFrameId) {
           cancelAnimationFrame(animationFrameId);
        }
    };
  }, [open, selectedDeviceId, hasCameraPermission]);

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                  <DialogTitle>Leitor de Código de Barras</DialogTitle>
                  <DialogDescription>
                      Selecione a câmera e aponte para o código de barras.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="camera-select" className="text-right">Câmera</Label>
                  <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                      <SelectTrigger id="camera-select" className="col-span-3">
                          <SelectValue placeholder="Selecione uma câmera" />
                      </SelectTrigger>
                      <SelectContent>
                          {devices.map(device => (
                              <SelectItem key={device.deviceId} value={device.deviceId}>
                                  {device.label || `Câmera ${devices.indexOf(device) + 1}`}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                         <Alert variant="destructive">
                              <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                              <AlertDescription>
                                  Por favor, permita o acesso à câmera para usar esta funcionalidade.
                              </AlertDescription>
                          </Alert>
                    )}
                </div>
              </div>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
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
            setNewEmployee({...emptyEmployee, id: new Date().toISOString() });
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
             }}
         />
        </>
    )
}

function EmployeeTable() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        try {
            const storedEmployees = localStorage.getItem('employees');
            if (storedEmployees) {
                setEmployees(JSON.parse(storedEmployees));
            } else {
                setEmployees(initialEmployees);
            }
        } catch (error) {
            console.error("Error reading from localStorage", error);
            setEmployees(initialEmployees);
        }
    }, []);

    useEffect(() => {
        try {
             if (employees.length > 0) { // Only save if there are employees
                localStorage.setItem('employees', JSON.stringify(employees));
            }
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [employees]);


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
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.plate && employee.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.ramal && employee.ramal.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Ramal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.plate}</TableCell>
                  <TableCell>{employee.ramal}</TableCell>
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


export function Dashboard() {
  return (
    <div className="container mx-auto">
      <div className="grid gap-6">
        <EmployeeTable />
      </div>
    </div>
  );
}

    