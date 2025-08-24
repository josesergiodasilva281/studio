
"use client";

import { useEffect, useState } from 'react';
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
import { Pencil, Trash2, PlusCircle, Home, Building } from 'lucide-react';
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
import { Badge } from './ui/badge';
import type { Visitor, AccessLog } from '@/lib/types';


const emptyVisitor: Visitor = {
    id: '',
    name: '',
    document: '',
    company: '',
};


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
                         <Badge
                            className={presence === 'Dentro' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                         >
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

export function VisitorDashboard() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

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
            // Do not save empty array if it was just initialized
            if (visitors.length > 0) {
                localStorage.setItem('visitors', JSON.stringify(visitors));
            } else {
                // If the user deletes all visitors, remove the item from localStorage
                localStorage.removeItem('visitors');
            }
        } catch (error) {
            console.error("Error writing visitors to localStorage", error);
        }
    }, [visitors]);

    // Load access logs from localStorage on initial render
     useEffect(() => {
        const loadLogs = () => {
            try {
                const storedLogs = localStorage.getItem('accessLogs');
                if (storedLogs) {
                    setAccessLogs(JSON.parse(storedLogs));
                }
            } catch (error) {
                console.error("Error reading access logs from localStorage", error);
            }
        };

        loadLogs();
        
        // Listen for custom event to reload logs
        const handleStorageChange = () => loadLogs();
        window.addEventListener('storage', handleStorageChange);
        
        // Cleanup listener
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


  return (
    <div className="container mx-auto">
        <VisitorTable visitors={visitors} setVisitors={setVisitors} accessLogs={accessLogs} />
    </div>
  );
}
