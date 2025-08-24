
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

const emptyCar: Car = {
    id: '', // Placa
    driver: '',
    fleet: '',
    km: '',
    status: 'Disponível',
};

function AddCarDialog({ open, onOpenChange, onSave, cars }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (car: Car) => void, cars: Car[] }) {
    const [newCar, setNewCar] = useState(emptyCar);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setNewCar(emptyCar);
        }
    }, [open]);

    const handleSaveClick = () => {
        if (!newCar.id || !newCar.driver || !newCar.fleet) {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Motorista, Frota e Placa são obrigatórios.',
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
        onSave(newCar);
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
                        <Label htmlFor="driver" className="text-right">Motorista</Label>
                        <Input id="driver" value={newCar.driver} onChange={(e) => setNewCar({ ...newCar, driver: e.target.value })} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fleet" className="text-right">Frota</Label>
                        <Input id="fleet" value={newCar.fleet} onChange={(e) => setNewCar({ ...newCar, fleet: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="id" className="text-right">Placa</Label>
                        <Input id="id" value={newCar.id} onChange={(e) => setNewCar({ ...newCar, id: e.target.value.toUpperCase() })} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="km" className="text-right">KM</Label>
                        <Input id="km" type="text" value={newCar.km} onChange={(e) => setNewCar({ ...newCar, km: e.target.value })} className="col-span-3" placeholder="Opcional" />
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

function CarLogDialog({ open, onOpenChange, car, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, car: Car, onSave: (log: Omit<CarLog, 'id' | 'carId' | 'carFleet' | 'driverName' | 'startTime' | 'endTime'>) => void }) {
    const [destination, setDestination] = useState('');
    const [notes, setNotes] = useState('');
    const { toast } = useToast();

    const handleSave = () => {
        if (!destination) {
            toast({ variant: 'destructive', title: 'Campo Obrigatório', description: 'Destino é obrigatório.' });
            return;
        }
        onSave({ destination, notes });
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
                        <Label className="text-right">Motorista</Label>
                        <p className="col-span-3">{car.driver}</p>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="destination" className="text-right">Destino</Label>
                        <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">Observações</Label>
                        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
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

function CarTable({ cars, setCars, carLogs, setCarLogs }: { cars: Car[], setCars: Dispatch<SetStateAction<Car[]>>, carLogs: CarLog[], setCarLogs: Dispatch<SetStateAction<CarLog[]>> }) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const handleEditClick = (car: Car) => {
        setSelectedCar(JSON.parse(JSON.stringify(car)));
        setIsEditDialogOpen(true);
    };
    
    const handleLogClick = (car: Car) => {
        setSelectedCar(car);
        if (car.status === 'Disponível') {
            setIsLogDialogOpen(true);
        } else if (car.status === 'Em uso') {
            handleReturn(car.id);
        } else {
            toast({ variant: 'destructive', title: 'Ação não permitida', description: 'Carro em manutenção.' });
        }
    };

    const handleReturn = (carId: string) => {
        const openLog = carLogs.find(log => log.carId === carId && log.endTime === null);
        if (!openLog) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não há registro de saída em aberto para este carro.' });
            return;
        }

        const updatedLogs = carLogs.map(log => log.id === openLog.id ? { ...log, endTime: new Date().toLocaleString('pt-BR') } : log);
        setCarLogs(updatedLogs);

        const updatedCars = cars.map(car => car.id === carId ? { ...car, status: 'Disponível' } : car);
        setCars(updatedCars);
        
        toast({ title: 'Retorno Registrado', description: `O carro de placa ${carId} está disponível novamente.` });
    };

    const handleCheckout = (logData: Omit<CarLog, 'id' | 'carId' | 'carFleet' | 'driverName' | 'startTime' | 'endTime'>) => {
        if (!selectedCar) return;

        const newLog: CarLog = {
            id: `carlog-${Date.now()}`,
            carId: selectedCar.id,
            carFleet: selectedCar.fleet,
            driverName: selectedCar.driver,
            startTime: new Date().toLocaleString('pt-BR'),
            endTime: null,
            ...logData
        };

        setCarLogs([newLog, ...carLogs]);
        
        const updatedCars = cars.map(c => c.id === selectedCar.id ? { ...c, status: 'Em uso' as const } : c);
        setCars(updatedCars);

        toast({ title: 'Saída Registrada', description: `O carro ${selectedCar.id} está em uso por ${selectedCar.driver}.` });
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
        return (
            car.id.toLowerCase().includes(searchTermLower) ||
            car.driver.toLowerCase().includes(searchTermLower) ||
            car.fleet.toLowerCase().includes(searchTermLower) ||
            (car.km && car.km.toLowerCase().includes(searchTermLower)) ||
            car.status.toLowerCase().includes(searchTermLower)
        );
    });

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
                                    <TableHead>Motorista</TableHead>
                                    <TableHead>Frota</TableHead>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>KM</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCars.length > 0 ? filteredCars.map((car) => (
                                    <TableRow key={car.id}>
                                        <TableCell>{car.driver}</TableCell>
                                        <TableCell>{car.fleet}</TableCell>
                                        <TableCell className="font-medium">{car.id}</TableCell>
                                        <TableCell>{car.km || '-'}</TableCell>
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
                                <Label htmlFor="driver-edit" className="text-right">Motorista</Label>
                                <Input id="driver-edit" value={selectedCar.driver} onChange={(e) => setSelectedCar({ ...selectedCar, driver: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="fleet-edit" className="text-right">Frota</Label>
                                <Input id="fleet-edit" value={selectedCar.fleet} onChange={(e) => setSelectedCar({ ...selectedCar, fleet: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="id-edit" className="text-right">Placa</Label>
                                <Input id="id-edit" value={selectedCar.id} className="col-span-3" disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="km-edit" className="text-right">KM</Label>
                                <Input id="km-edit" value={selectedCar.km} onChange={(e) => setSelectedCar({ ...selectedCar, km: e.target.value })} className="col-span-3" />
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
        </>
    );
}

export function CarDashboard({ cars, setCars, carLogs, setCarLogs, employees }: { cars: Car[], setCars: Dispatch<SetStateAction<Car[]>>, carLogs: CarLog[], setCarLogs: Dispatch<SetStateAction<CarLog[]>>, employees: Employee[] }) {

    // Load initial data from localStorage if not provided
    useEffect(() => {
        if (cars.length === 0) {
            try {
                const storedCars = localStorage.getItem('cars');
                if (storedCars) {
                    setCars(JSON.parse(storedCars));
                }
            } catch (error) {
                console.error("Error reading cars from localStorage", error);
            }
        }
         if (carLogs.length === 0) {
            try {
                const storedLogs = localStorage.getItem('carLogs');
                if (storedLogs) {
                    setCarLogs(JSON.parse(storedLogs));
                }
            } catch (error) {
                console.error("Error reading car logs from localStorage", error);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save data to localStorage when it changes
    useEffect(() => {
        if(cars.length > 0) {
            localStorage.setItem('cars', JSON.stringify(cars));
        } else {
             const stored = localStorage.getItem('cars');
             if (stored) localStorage.removeItem('cars');
        }
    }, [cars]);
    
    useEffect(() => {
        if(carLogs.length > 0) {
            localStorage.setItem('carLogs', JSON.stringify(carLogs));
        } else {
             const stored = localStorage.getItem('carLogs');
             if (stored) localStorage.removeItem('carLogs');
        }
    }, [carLogs]);

    return (
        <div className="container mx-auto">
            <CarTable
                cars={cars}
                setCars={setCars}
                carLogs={carLogs}
                setCarLogs={setCarLogs}
            />
        </div>
    );
}
