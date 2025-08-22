
"use client";

import { useEffect, useState } from 'react';
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
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
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

interface Employee {
  id: string;
  name: string;
  department: string;
  plate: string;
  ramal: string;
}

const initialEmployees: Employee[] = [
  { id: '12345', name: 'João da Silva', department: 'Produção', plate: 'ABC-1234', ramal: '2101' },
  { id: '67890', name: 'Maria Oliveira', department: 'Logística', plate: 'DEF-5678', ramal: '2102' },
  { id: '11223', name: 'Pedro Souza', department: 'Administrativo', plate: 'GHI-9012', ramal: '2103' },
];

const emptyEmployee: Omit<Employee, 'id'> = {
    name: '',
    department: '',
    plate: '',
    ramal: '',
};

function AddEmployeeDialog({ open, onOpenChange, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (employee: Employee) => void }) {
    const { toast } = useToast();
    const [newEmployee, setNewEmployee] = useState(emptyEmployee);

    useEffect(() => {
        if (open) {
            setNewEmployee(emptyEmployee);
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
        onSave({ ...newEmployee, id: new Date().getTime().toString() });
        onOpenChange(false);
    }
    
    return (
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
            localStorage.setItem('employees', JSON.stringify(employees));
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
        employee.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.ramal.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Card>
          <CardHeader>
            <CardTitle>Painel de Controle - Recursos Humanos</CardTitle>
          </CardHeader>
          <CardContent>
             {/* Futuramente, aqui podemos adicionar componentes específicos para cada perfil */}
          </CardContent>
        </Card>

        <EmployeeTable />
      </div>
    </div>
  );
}
