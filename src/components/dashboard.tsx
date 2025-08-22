
"use client";

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Pencil, Trash2, Calendar as CalendarIcon, PlusCircle, Camera } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  department: string;
  plate: string;
  ramal: string;
  portaria: 'P1' | 'P2';
  status: 'Ativo' | 'Inativo';
  inactivationStart: Date | null;
  inactivationEnd: Date | null;
}

const initialEmployees: Employee[] = [
  { id: '12345', name: 'João da Silva', department: 'Produção', plate: 'ABC-1234', ramal: '2101', portaria: 'P1', status: 'Ativo', inactivationStart: null, inactivationEnd: null },
  { id: '67890', name: 'Maria Oliveira', department: 'Logística', plate: 'DEF-5678', ramal: '2102', portaria: 'P2', status: 'Ativo', inactivationStart: null, inactivationEnd: null },
  { id: '11223', name: 'Pedro Souza', department: 'Administrativo', plate: 'GHI-9012', ramal: '2103', portaria: 'P1', status: 'Ativo', inactivationStart: null, inactivationEnd: null },
];

const emptyEmployee: Employee = {
    id: '',
    name: '',
    department: '',
    plate: '',
    ramal: '',
    portaria: 'P1',
    status: 'Ativo',
    inactivationStart: null,
    inactivationEnd: null
};


function AddEmployeeDialog({ open, onOpenChange, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (employee: Employee) => void }) {
    const { toast } = useToast();
    const [newEmployee, setNewEmployee] = useState<Employee>(emptyEmployee);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isBarcodeSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

    useEffect(() => {
        if (open) {
            setNewEmployee(emptyEmployee); // Reseta o formulário ao abrir
            setIsCameraOpen(false); // Garante que a câmera esteja fechada
            setHasCameraPermission(null);
        }
    }, [open]);

    useEffect(() => {
        let stream: MediaStream | undefined;
        let animationFrameId: number | undefined;

        const cleanup = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

        if (!isCameraOpen) {
            cleanup();
            return;
        }

        const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'ean_13', 'upc_a']
        });

        const detectBarcode = async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                    const barcodes = await barcodeDetector.detect(videoRef.current);
                    if (barcodes.length > 0) {
                        const scannedId = barcodes[0].rawValue;
                        setNewEmployee(prev => ({ ...prev, id: scannedId }));
                        toast({
                            title: 'Código Lido com Sucesso!',
                            description: `Matrícula preenchida: ${scannedId}`,
                        });
                        setIsCameraOpen(false);
                    }
                } catch (error) {
                    console.error('Barcode detection failed:', error);
                }
            }
            if (isCameraOpen) { // Keep scanning if camera is still open
                animationFrameId = requestAnimationFrame(detectBarcode);
            }
        };

        const startScan = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                setHasCameraPermission(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play(); // Ensure video is playing
                    animationFrameId = requestAnimationFrame(detectBarcode);
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Acesso à Câmera Negado',
                    description: 'Por favor, habilite a permissão da câmera no seu navegador.',
                });
                setIsCameraOpen(false);
            }
        };

        if (isBarcodeSupported) {
             startScan();
        }

        return cleanup;
    }, [isCameraOpen, toast, isBarcodeSupported]);


    const handleSaveClick = () => {
        if (!newEmployee.id || !newEmployee.name || !newEmployee.department) {
             toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Matrícula, Nome e Setor precisam ser preenchidos.',
            });
            return;
        }
        onSave(newEmployee);
        onOpenChange(false);
    }
    
    const openCamera = () => {
        if (!isBarcodeSupported) {
             toast({
                variant: 'destructive',
                title: 'Função não suportada',
                description: 'Seu navegador não suporta a leitura de código de barras.',
            });
            return;
        }
        setIsCameraOpen(true);
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setIsCameraOpen(false);
            }
            onOpenChange(isOpen);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
                    <DialogDescription>
                       Preencha os dados abaixo para cadastrar um novo funcionário.
                    </DialogDescription>
                </DialogHeader>
                 <div className="flex flex-col gap-4 py-4">
                     {isCameraOpen ? (
                        <div className="flex flex-col items-center gap-2">
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                            {hasCameraPermission === null && <p>Solicitando permissão...</p>}
                            {hasCameraPermission === true && <p className="text-sm text-muted-foreground">Aponte para o código de barras...</p>}
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <AlertTitle>Acesso à Câmera Requerido</AlertTitle>
                                    <AlertDescription>
                                        Por favor, permita o acesso à câmera para usar esta funcionalidade.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="id" className="text-right">Matrícula</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                     <Input id="id" value={newEmployee.id} onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})} className="flex-grow" placeholder="Digite ou leia o código" />
                                     <Button type="button" variant="outline" size="icon" onClick={openCamera}>
                                        <Camera className="h-4 w-4" />
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
                                <Label htmlFor="portaria" className="text-right">Portaria</Label>
                                <Select
                                    value={newEmployee.portaria}
                                    onValueChange={(value: 'P1' | 'P2') => setNewEmployee({...newEmployee, portaria: value})}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione a portaria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="P1">P1</SelectItem>
                                        <SelectItem value="P2">P2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                     <Button type="button" variant="outline" onClick={() => {
                        setIsCameraOpen(false); // Garante que a camera feche
                        onOpenChange(false);
                    }}>Cancelar</Button>
                    <Button type="submit" onClick={handleSaveClick} disabled={isCameraOpen}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EmployeeTable() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.plate}</TableCell>
                  <TableCell>{employee.ramal}</TableCell>
                  <TableCell>{employee.portaria}</TableCell>
                  <TableCell>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", employee.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                      {employee.status}
                    </span>
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
        </CardContent>
      </Card>

      <AddEmployeeDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSave={handleAddNewEmployee} />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Altere os dados do funcionário. Clique em salvar para aplicar as mudanças.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
             <div className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input id="name" value={selectedEmployee.name} onChange={(e) => setSelectedEmployee({...selectedEmployee, name: e.target.value})} className="col-span-3" />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">Setor</Label>
                  <Input id="department" value={selectedEmployee.department} onChange={(e) => setSelectedEmployee({...selectedEmployee, department: e.target.value})} className="col-span-3" />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plate" className="text-right">Placa</Label>
                  <Input id="plate" value={selectedEmployee.plate} onChange={(e) => setSelectedEmployee({...selectedEmployee, plate: e.target.value})} className="col-span-3" />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ramal" className="text-right">Ramal</Label>
                  <Input id="ramal" value={selectedEmployee.ramal} onChange={(e) => setSelectedEmployee({...selectedEmployee, ramal: e.target.value})} className="col-span-3" />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="portaria" className="text-right">Portaria</Label>
                   <Select
                      value={selectedEmployee.portaria}
                      onValueChange={(value: 'P1' | 'P2') => setSelectedEmployee({...selectedEmployee, portaria: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a portaria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1">P1</SelectItem>
                        <SelectItem value="P2">P2</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">Status</Label>
                   <Select
                      value={selectedEmployee.status}
                      onValueChange={(value: 'Ativo' | 'Inativo') => setSelectedEmployee({...selectedEmployee, status: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                {selectedEmployee.status === 'Inativo' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Início</Label>
                       <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal col-span-3",
                              !selectedEmployee.inactivationStart && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedEmployee.inactivationStart ? format(new Date(selectedEmployee.inactivationStart), "PPP") : <span>Escolha uma data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedEmployee.inactivationStart ? new Date(selectedEmployee.inactivationStart) : undefined}
                            onSelect={(date) => setSelectedEmployee({...selectedEmployee, inactivationStart: date ?? null})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Fim</Label>
                       <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal col-span-3",
                              !selectedEmployee.inactivationEnd && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedEmployee.inactivationEnd ? format(new Date(selectedEmployee.inactivationEnd), "PPP") : <span>Escolha uma data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedEmployee.inactivationEnd ? new Date(selectedEmployee.inactivationEnd) : undefined}
                            onSelect={(date) => setSelectedEmployee({...selectedEmployee, inactivationEnd: date ?? null})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
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


export function Dashboard({ role }: { role: string | null }) {
  const getRoleName = (role: string | null) => {
    switch (role) {
      case 'rh':
        return 'Recursos Humanos';
      case 'portaria1':
        return 'Portaria 1';
      case 'portaria2':
        return 'Portaria 2';
      case 'supervisor':
        return 'Supervisor';
      default:
        return 'Usuário';
    }
  }

  return (
    <div className="container mx-auto">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Painel de Controle - {getRoleName(role)}</CardTitle>
          </CardHeader>
          <CardContent>
             {/* Futuramente, aqui podemos adicionar componentes específicos para cada perfil */}
          </CardContent>
        </Card>

        {role === 'rh' && <EmployeeTable />}

        {(role === 'portaria1' || role === 'portaria2' || role === 'supervisor') && (
            <Card>
                <CardHeader>
                    <CardTitle>Leitor de Acesso</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>A funcionalidade de leitura de QR Code para acesso de portaria será implementada aqui.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

    