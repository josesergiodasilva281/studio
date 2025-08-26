
"use client";

import { useEffect, useState, Dispatch, SetStateAction } from 'react';
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
import { Pencil, Trash2, PlusCircle, GanttChartSquare, Key, LogOut } from 'lucide-react';
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
import type { Car, CarLog, Employee } from '@/lib/types';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

const emptyCar: Omit<Car, 'id' | 'status' | 'lastDriverName' | 'lastKm'> = {
    fleet: '',
};

function AddCarDialog({ open, onOpenChange, onSave, cars }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (car: Car) => void, cars: Car[] }) {
    const [newCar, setNewCar] = useState<{fleet: string, id: string}>({ fleet: '', id: ''});
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setNewCar({ fleet: '', id: ''});
        }
    }, [open]);

    const handleSaveClick = () => {
        if (!newCar.id || !newCar.fleet) {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Frota e Placa são obrigatórios.',
            });
            return;
        }
        if (cars.some(car => car.id === newCar.id)) {
            toast({
                variant: 'destructive',
                title: 'Placa Duplicada',
                description: 'Já existe um carro cadastrado com esta placa.',
            });
            return;
        }
        onSave({ ...newCar, status: 'Disponível' });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Carro</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fleet" className="text-right">Frota</Label>
                        <Input id="fleet" value={newCar.fleet} onChange={(e) => setNewCar({ ...newCar, fleet: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="id" className="text-right">Placa</Label>
                        <Input id="id" value={newCar.id} onChange={(e) => setNewCar({ ...newCar, id: e.target.value.toUpperCase() })} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSaveClick}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type CarCheckoutData = {
    driverName: string;
    startKm?: string;
}

type CarReturnData = {
    driverName: string;
    endKm?: string;
}

function CarLogDialog({ open, onOpenChange, car, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, car: Car, onSave: (logData: CarCheckoutData) => void }) {
    const [checkoutData, setCheckoutData] = useState<CarCheckoutData>({
      driverName: car.lastDriverName || '',
      startKm: car.lastKm || '',
    });
    const { toast } = useToast();

    useEffect(() => {
        if(open){
            setCheckoutData({
                driverName: car.lastDriverName || '',
                startKm: car.lastKm || '',
            })
        }
    }, [open, car]);


    const handleSave = () => {
        if (!checkoutData.driverName) {
            toast({ variant: 'destructive', title: 'Campo Obrigatório', description: 'Motorista é obrigatório.' });
            return;
        }
        onSave(checkoutData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Saída de Veículo</DialogTitle>
                    <DialogDescription>
                        Frota: {car.fleet} - Placa: {car.id}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="driverName" className="text-right">Motorista</Label>
                         <Input 
                            id="driverName" 
                            value={checkoutData.driverName} 
                            onChange={(e) => setCheckoutData({...checkoutData, driverName: e.target.value})} 
                            className="col-span-3" 
                            placeholder="Digite o nome do motorista"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startKm" className="text-right">KM Saída</Label>
                        <Input id="startKm" value={checkoutData.startKm} onChange={(e) => setCheckoutData({...checkoutData, startKm: e.target.value})} className="col-span-3" placeholder="Opcional"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Confirmar Saída</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CarReturnDialog({ open, onOpenChange, car, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, car: Car, onSave: (returnData: CarReturnData) => void }) {
    const [returnData, setReturnData] = useState<CarReturnData>({ driverName: car.lastDriverName || '', endKm: car.lastKm || '' });
    
    useEffect(() => {
        if(open){
            setReturnData({ 
                driverName: car.lastDriverName || '',
                endKm: car.lastKm || '' 
            })
        }
    }, [open, car]);

    const handleSave = () => {
        onSave(returnData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Retorno de Veículo</DialogTitle>
                    <DialogDescription>
                        Frota: {car.fleet} - Placa: {car.id}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="driverName-return" className="text-right">Motorista</Label>
                        <Input id="driverName-return" value={returnData.driverName} onChange={(e) => setReturnData({...returnData, driverName: e.target.value})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endKm" className="text-right">KM Retorno</Label>
                        <Input id="endKm" value={returnData.endKm} onChange={(e) => setReturnData({ ...returnData, endKm: e.target.value })} className="col-span-3" placeholder="Opcional"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Confirmar Retorno</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function CarTable({ cars, setCars, carLogs, setCarLogs, role }: { cars: Car[], setCars: Dispatch<SetStateAction<Car[]>>, carLogs: CarLog[], setCarLogs: Dispatch<SetStateAction<CarLog[]>>, role: 'rh' | 'portaria' }) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const { user } = useAuth();

    const handleEditClick = (car: Car) => {
        setSelectedCar(JSON.parse(JSON.stringify(car)));
        setIsEditDialogOpen(true);
    };
    
    const handleLogClick = (car: Car) => {
        setSelectedCar(car);
        if (car.status === 'Disponível') {
            setIsLogDialogOpen(true);
        } else if (car.status === 'Em uso') {
            setIsReturnDialogOpen(true);
        } else {
            toast({ variant: 'destructive', title: 'Ação não permitida', description: 'Carro em manutenção.' });
        }
    };

    const handleReturn = (carId: string, returnData: CarReturnData) => {
        if (!user) return;
        const registeredBy = user.role === 'rh' ? 'RH' : (user.username === 'portaria1' ? 'P1' : 'P2');
        
        const openLog = carLogs.find(log => log.carId === carId && log.endTime === null);
        if (!openLog) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não há registro de saída em aberto para este carro.' });
            return;
        }

        const updatedLogs = carLogs.map(log => 
            log.id === openLog.id 
                ? { ...log, endTime: new Date().toLocaleString('pt-BR'), endKm: returnData.endKm, returnDriverName: returnData.driverName, endRegisteredBy: registeredBy } 
                : log
        );
        setCarLogs(updatedLogs);

        const updatedCars = cars.map(car => car.id === carId ? { ...car, status: 'Disponível', lastKm: returnData.endKm, lastDriverName: returnData.driverName } : car);
        setCars(updatedCars);
        
        toast({ title: 'Retorno Registrado', description: `O carro de placa ${carId} está disponível novamente.` });
        setSelectedCar(null);
    };

    const handleCheckout = (logData: CarCheckoutData) => {
        if (!selectedCar || !user) return;
        
        const registeredBy = user.role === 'rh' ? 'RH' : (user.username === 'portaria1' ? 'P1' : 'P2');

        const newLog: CarLog = {
            id: `carlog-${Date.now()}`,
            carId: selectedCar.id,
            carFleet: selectedCar.fleet,
            driverName: logData.driverName,
            startTime: new Date().toLocaleString('pt-BR'),
            endTime: null,
            startKm: logData.startKm,
            startRegisteredBy: registeredBy,
        };

        setCarLogs([newLog, ...carLogs]);
        
        const updatedCars = cars.map(c => c.id === selectedCar.id ? { ...c, status: 'Em uso' as const, lastDriverName: logData.driverName, lastKm: logData.startKm } : c);
        setCars(updatedCars);

        toast({ title: 'Saída Registrada', description: `O carro ${selectedCar.id} está em uso por ${logData.driverName}.` });
        setSelectedCar(null);
    };

    const handleDeleteClick = (carId: string) => {
        if (carLogs.some(log => log.carId === carId && log.endTime === null)) {
            toast({ variant: 'destructive', title: 'Ação não permitida', description: 'Não é possível excluir um carro que está em uso.' });
            return;
        }
        setCars(cars.filter(c => c.id !== carId));
        toast({ title: 'Carro Excluído', description: 'O registro do carro foi removido.' });
    };

    const handleSave = () => {
        if (selectedCar) {
            setCars(cars.map(c => c.id === selectedCar.id ? selectedCar : c));
        }
        setIsEditDialogOpen(false);
        setSelectedCar(null);
    };

    const handleAddNewCar = (car: Car) => {
        setCars([car, ...cars]);
    };

    const filteredCars = cars.filter(car => {
        const searchTermLower = searchTerm.toLowerCase();
        const lastLog = carLogs.find(log => log.carId === car.id && log.endTime === null);
        const driverName = lastLog ? lastLog.driverName : '';

        return (
            car.id.toLowerCase().includes(searchTermLower) ||
            driverName.toLowerCase().includes(searchTermLower) ||
            car.fleet.toLowerCase().includes(searchTermLower) ||
            car.status.toLowerCase().includes(searchTermLower) ||
            (car.lastDriverName && car.lastDriverName.toLowerCase().includes(searchTermLower))
        );
    });

    const getCarDriverName = (car: Car) => {
        if (car.status === 'Em uso') {
            const openLog = carLogs.find(log => log.carId === car.id && log.endTime === null);
            return openLog?.driverName || 'N/A';
        }
        return car.lastDriverName || '-';
    }


    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Frota da Empresa</CardTitle>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Cadastrar Carro
                        </Button>
                        <Link href="/cars/history">
                          <Button variant="outline">
                            <GanttChartSquare className="mr-2 h-4 w-4" />
                            Ver Histórico
                          </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Filtrar por placa, motorista, frota..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Frota</TableHead>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Motorista</TableHead>
                                    <TableHead>Último KM</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCars.length > 0 ? filteredCars.map((car) => (
                                    <TableRow key={car.id}>
                                        <TableCell>{car.fleet}</TableCell>
                                        <TableCell className="font-medium">{car.id}</TableCell>
                                        <TableCell>{getCarDriverName(car)}</TableCell>
                                        <TableCell>{car.lastKm || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                car.status === 'Disponível' ? 'default' : car.status === 'Em uso' ? 'destructive' : 'secondary'
                                            }>{car.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleLogClick(car)} title={car.status === 'Em uso' ? 'Registrar Retorno' : 'Registrar Saída'}>
                                                {car.status === 'Em uso' ? <LogOut/> : <Key />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(car)}>
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
                                                                Essa ação não pode ser desfeita. Isso irá apagar permanentemente o carro.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteClick(car.id)}>Apagar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">Nenhum carro encontrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AddCarDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSave={handleAddNewCar} cars={cars} />

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Carro</DialogTitle>
                    </DialogHeader>
                    {selectedCar && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="fleet-edit" className="text-right">Frota</Label>
                                <Input id="fleet-edit" value={selectedCar.fleet} onChange={(e) => setSelectedCar({ ...selectedCar, fleet: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="id-edit" className="text-right">Placa</Label>
                                <Input id="id-edit" value={selectedCar.id} className="col-span-3" disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status-edit" className="text-right">Status</Label>
                                <Select value={selectedCar.status} onValueChange={(value: 'Disponível' | 'Em uso' | 'Manutenção') => setSelectedCar({ ...selectedCar, status: value })}>
                                    <SelectTrigger id="status-edit" className="col-span-3">
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Disponível">Disponível</SelectItem>
                                        <SelectItem value="Em uso">Em uso</SelectItem>
                                        <SelectItem value="Manutenção">Manutenção</SelectItem>
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
            {selectedCar && <CarLogDialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen} car={selectedCar} onSave={handleCheckout} />}
            {selectedCar && <CarReturnDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen} car={selectedCar} onSave={(data) => handleReturn(selectedCar.id, data)} />}
        </>
    );
}

export function CarDashboard({ cars, setCars, carLogs, setCarLogs, employees: initialEmployees, role = 'rh' }: { cars: Car[], setCars: Dispatch<SetStateAction<Car[]>>, carLogs: CarLog[], setCarLogs: Dispatch<SetStateAction<CarLog[]>>, employees: Employee[], role?: 'rh' | 'portaria' }) {

    // This component no longer needs employees, but we keep the prop for now to avoid breaking changes in parent components.
    
    return (
        <div className="container mx-auto">
            <CarTable
                cars={cars}
                setCars={setCars}
                carLogs={carLogs}
                setCarLogs={setCarLogs}
                role={role}
            />
        </div>
    );
}
