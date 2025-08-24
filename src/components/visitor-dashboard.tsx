
"use client";

import { useEffect, useState, useRef, KeyboardEvent, Dispatch, SetStateAction } from 'react';
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
import { Pencil, Trash2, PlusCircle, Home, Building, GanttChartSquare, Camera, User, LogIn } from 'lucide-react';
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
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


const emptyVisitor: Visitor = {
    id: '',
    photoDataUrl: '',
    name: '',
    rg: '',
    cpf: '',
    company: '',
    plate: '',
    responsible: '',
    reason: '',
};

type ReturningVisitorInfo = Pick<Visitor, 'company' | 'plate' | 'responsible' | 'reason'>;


function VisitorTable({ visitors, setVisitors, accessLogs, setAccessLogs }: { visitors: Visitor[], setVisitors: Dispatch<SetStateAction<Visitor[]>>, accessLogs: AccessLog[], setAccessLogs: Dispatch<SetStateAction<AccessLog[]>> }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isReturningVisitorDialogOpen, setIsReturningVisitorDialogOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const { toast } = useToast();

    const handleEditClick = (visitor: Visitor) => {
        setSelectedVisitor(JSON.parse(JSON.stringify(visitor))); // Deep copy
        setIsEditDialogOpen(true);
    };
    
    const handleReturningVisitorClick = (visitor: Visitor) => {
        setSelectedVisitor(JSON.parse(JSON.stringify(visitor))); // Deep copy
        setIsReturningVisitorDialogOpen(true);
    };

    const handleDeleteClick = (visitorId: string) => {
        setVisitors(visitors.filter(v => v.id !== visitorId));
    };

    const handleSave = (visitor: Visitor) => {
        setVisitors(visitors.map(v => v.id === visitor.id ? visitor : v));
        setIsEditDialogOpen(false);
        setSelectedVisitor(null);
    };

    const handleAddNewVisitor = (visitor: Visitor) => {
        setVisitors([visitor, ...visitors]);
        setIsAddDialogOpen(false);
    };
    
    const handleNewLog = (visitor: Visitor, newInfo?: ReturningVisitorInfo) => {
        const visitorLogs = accessLogs
            .filter(log => log.personId === visitor.id)
            .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

        const lastLog = visitorLogs[0];
        const newLogType = !lastLog || lastLog.type === 'Saída' ? 'Entrada' : 'Saída';

        const updatedVisitor = newInfo ? { ...visitor, ...newInfo } : visitor;

        const newLog: AccessLog = {
            id: new Date().toISOString(),
            personId: updatedVisitor.id,
            personName: updatedVisitor.name,
            personType: 'visitor',
            timestamp: new Date().toLocaleString('pt-BR'),
            type: newLogType,
        };
        
        setAccessLogs([newLog, ...accessLogs]);
        
        // If it's a returning visitor, update their info in the main visitors list
        if (newInfo) {
            setVisitors(visitors.map(v => v.id === updatedVisitor.id ? updatedVisitor : v));
        }

        toast({
            title: `Acesso Registrado: ${newLog.type}`,
            description: `${newLog.personName} - ${newLog.timestamp}`,
            variant: newLog.type === 'Entrada' ? 'default' : 'destructive'
        });
        
        setIsReturningVisitorDialogOpen(false);
        setSelectedVisitor(null);
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

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            setSearchTerm(inputValue);
        }
    };

    const filteredVisitors = visitors.filter(visitor => {
        const presenceStatus = getPresenceStatus(visitor.id);
        const searchTermLower = searchTerm.toLowerCase();

        return (
            visitor.id.toLowerCase().includes(searchTermLower) ||
            visitor.name.toLowerCase().includes(searchTermLower) ||
            visitor.rg.toLowerCase().includes(searchTermLower) ||
            visitor.cpf.toLowerCase().includes(searchTermLower) ||
            (visitor.company && visitor.company.toLowerCase().includes(searchTermLower)) ||
            (visitor.plate && visitor.plate.toLowerCase().includes(searchTermLower)) ||
            visitor.responsible.toLowerCase().includes(searchTermLower) ||
            visitor.reason.toLowerCase().includes(searchTermLower) ||
            presenceStatus.toLowerCase().includes(searchTermLower)
        );
    });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Visitantes</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/visitors/history">
                    <Button variant="outline">
                      <GanttChartSquare className="mr-2 h-4 w-4" />
                      Ver Histórico
                    </Button>
                </Link>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Cadastrar Visitante
                </Button>
            </div>
        </CardHeader>
        <CardContent>
           <div className="flex items-center py-4">
            <Input
                placeholder="Filtrar visitantes..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>RG</TableHead>
                    <TableHead>CPF</TableHead>
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
                    <TableCell>
                        <Avatar>
                            <AvatarImage src={visitor.photoDataUrl} alt={visitor.name} />
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell>{visitor.name}</TableCell>
                    <TableCell>{visitor.rg}</TableCell>
                    <TableCell>{visitor.cpf}</TableCell>
                    <TableCell>{visitor.company || '-'}</TableCell>
                     <TableCell>
                         <Badge
                            variant={presence === 'Dentro' ? 'default' : 'destructive'}
                         >
                            {presence === 'Dentro' ? <Building className="mr-1 h-3 w-3" /> : <Home className="mr-1 h-3 w-3" />}
                            {presence}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleReturningVisitorClick(visitor)} title="Registrar Entrada/Saída">
                            <LogIn className="h-4 w-4" />
                        </Button>
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
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Cadastrar Novo Visitante</DialogTitle>
              </DialogHeader>
              <AddVisitorForm onSave={handleAddNewVisitor} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Editar Visitante</DialogTitle>
              </DialogHeader>
              {selectedVisitor && <AddVisitorForm
                initialData={selectedVisitor}
                onSave={handleSave}
                onCancel={() => setIsEditDialogOpen(false)}
              />}
          </DialogContent>
      </Dialog>
      
      <Dialog open={isReturningVisitorDialogOpen} onOpenChange={setIsReturningVisitorDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Registrar Visita Recorrente</DialogTitle>
                   <DialogDescription>
                    Confirme os dados para a nova visita de {selectedVisitor?.name}.
                  </DialogDescription>
              </DialogHeader>
              {selectedVisitor && (
                <ReturningVisitorForm 
                    visitor={selectedVisitor}
                    onSave={(info) => handleNewLog(selectedVisitor, info)}
                    onCancel={() => setIsReturningVisitorDialogOpen(false)}
                />
              )}
          </DialogContent>
      </Dialog>
    </>
  );
}

function ReturningVisitorForm({ visitor, onSave, onCancel }: { visitor: Visitor, onSave: (info: ReturningVisitorInfo) => void, onCancel: () => void }) {
    const [info, setInfo] = useState<ReturningVisitorInfo>({
        company: visitor.company || '',
        plate: visitor.plate || '',
        responsible: '',
        reason: ''
    });
    const { toast } = useToast();

    const companyInputRef = useRef<HTMLInputElement>(null);
    const plateInputRef = useRef<HTMLInputElement>(null);
    const responsibleInputRef = useRef<HTMLInputElement>(null);
    const reasonInputRef = useRef<HTMLInputElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        companyInputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextFieldRef: React.RefObject<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextFieldRef.current?.focus();
        }
    };

    const handleSave = () => {
        if (!info.responsible || !info.reason) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Responsável e Motivo são obrigatórios.' });
            return;
        }
        onSave(info);
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-md border bg-muted">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={visitor.photoDataUrl} alt={visitor.name} />
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-lg">{visitor.name}</p>
                    <p className="text-sm text-muted-foreground">RG: {visitor.rg} | CPF: {visitor.cpf}</p>
                </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company-returning" className="text-right">Empresa</Label>
                <Input ref={companyInputRef} onKeyDown={(e) => handleKeyDown(e, plateInputRef)} id="company-returning" value={info.company} onChange={(e) => setInfo({ ...info, company: e.target.value })} className="col-span-3" placeholder="Opcional"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plate-returning" className="text-right">Placa</Label>
                <Input ref={plateInputRef} onKeyDown={(e) => handleKeyDown(e, responsibleInputRef)} id="plate-returning" value={info.plate} onChange={(e) => setInfo({ ...info, plate: e.target.value })} className="col-span-3" placeholder="Opcional"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="responsible-returning" className="text-right">Responsável</Label>
                <Input ref={responsibleInputRef} onKeyDown={(e) => handleKeyDown(e, reasonInputRef)} id="responsible-returning" value={info.responsible} onChange={(e) => setInfo({ ...info, responsible: e.target.value })} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason-returning" className="text-right">Motivo</Label>
                <Input ref={reasonInputRef} onKeyDown={(e) => handleKeyDown(e, saveButtonRef)} id="reason-returning" value={info.reason} onChange={(e) => setInfo({ ...info, reason: e.target.value })} className="col-span-3" />
            </div>
             <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button ref={saveButtonRef} onClick={handleSave}>Salvar</Button>
            </DialogFooter>
        </div>
    )
}

function AddVisitorForm({ onSave, onCancel, initialData }: { onSave: (visitor: Visitor) => void, onCancel: () => void, initialData?: Visitor }) {
    const [visitor, setVisitor] = useState(initialData || { ...emptyVisitor, id: `visit-${Date.now()}` });
    const { toast } = useToast();
    
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const nameInputRef = useRef<HTMLInputElement>(null);
    const rgInputRef = useRef<HTMLInputElement>(null);
    const cpfInputRef = useRef<HTMLInputElement>(null);
    const companyInputRef = useRef<HTMLInputElement>(null);
    const plateInputRef = useRef<HTMLInputElement>(null);
    const responsibleInputRef = useRef<HTMLInputElement>(null);
    const reasonInputRef = useRef<HTMLInputElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    
    useEffect(() => {
        if (isCameraOpen) {
            const getCameraPermission = async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({video: true});
                setHasCameraPermission(true);
        
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                }
              } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                  variant: 'destructive',
                  title: 'Acesso à Câmera Negado',
                  description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
                });
              }
            };
        
            getCameraPermission();

            return () => {
                // Stop camera stream when component unmounts or camera is closed
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        }
    }, [isCameraOpen, toast]);

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setVisitor({ ...visitor, photoDataUrl: dataUrl });
                setIsCameraOpen(false); // Close camera after taking photo
            }
        }
    }
    
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextFieldRef: React.RefObject<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextFieldRef.current?.focus();
        }
    };

    const handleSave = () => {
         if (!visitor.photoDataUrl) {
            toast({ variant: 'destructive', title: 'Campo Obrigatório', description: 'A foto do visitante é obrigatória.' });
            return;
         }
         if (!visitor.name || !visitor.rg || !visitor.cpf || !visitor.responsible || !visitor.reason) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Nome, RG, CPF, Responsável e Motivo são obrigatórios.' });
            return;
        }
        onSave(visitor);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Coluna da Câmera */}
            <div className="space-y-4 flex flex-col items-center">
                 <Label>Foto do Visitante</Label>
                 <div className="w-full max-w-xs aspect-square rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                    {isCameraOpen ? (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
                    ) : visitor.photoDataUrl ? (
                         <img src={visitor.photoDataUrl} alt="Foto do Visitante" className="w-full h-full object-cover" />
                    ) : (
                        <User className="h-24 w-24 text-muted-foreground" />
                    )}
                 </div>
                 {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                        <AlertDescription>
                        Por favor, permita o acesso à câmera para tirar a foto.
                        </AlertDescription>
                    </Alert>
                 )}
                 <div className="flex gap-2">
                    <Button type="button" onClick={() => setIsCameraOpen(!isCameraOpen)}>
                        <Camera className="mr-2 h-4 w-4" />
                        {isCameraOpen ? 'Fechar Câmera' : 'Abrir Câmera'}
                    </Button>
                    {isCameraOpen && hasCameraPermission && (
                        <Button type="button" onClick={handleTakePhoto}>Tirar Foto</Button>
                    )}
                 </div>
                 <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Coluna do Formulário */}
            <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name-visitor" className="text-right">Nome</Label>
                    <Input ref={nameInputRef} onKeyDown={(e) => handleKeyDown(e, rgInputRef)} id="name-visitor" value={visitor.name} onChange={(e) => setVisitor({ ...visitor, name: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rg-visitor" className="text-right">RG</Label>
                    <Input ref={rgInputRef} onKeyDown={(e) => handleKeyDown(e, cpfInputRef)} id="rg-visitor" value={visitor.rg} onChange={(e) => setVisitor({ ...visitor, rg: e.target.value })} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cpf-visitor" className="text-right">CPF</Label>
                    <Input ref={cpfInputRef} onKeyDown={(e) => handleKeyDown(e, companyInputRef)} id="cpf-visitor" value={visitor.cpf} onChange={(e) => setVisitor({ ...visitor, cpf: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company-visitor" className="text-right">Empresa</Label>
                    <Input ref={companyInputRef} onKeyDown={(e) => handleKeyDown(e, plateInputRef)} id="company-visitor" value={visitor.company} onChange={(e) => setVisitor({ ...visitor, company: e.target.value })} className="col-span-3" placeholder="Opcional"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plate-visitor" className="text-right">Placa</Label>
                    <Input ref={plateInputRef} onKeyDown={(e) => handleKeyDown(e, responsibleInputRef)} id="plate-visitor" value={visitor.plate} onChange={(e) => setVisitor({ ...visitor, plate: e.target.value })} className="col-span-3" placeholder="Opcional"/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsible-visitor" className="text-right">Responsável</Label>
                    <Input ref={responsibleInputRef} onKeyDown={(e) => handleKeyDown(e, reasonInputRef)} id="responsible-visitor" value={visitor.responsible} onChange={(e) => setVisitor({ ...visitor, responsible: e.target.value })} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason-visitor" className="text-right">Motivo</Label>
                    <Input ref={reasonInputRef} onKeyDown={(e) => handleKeyDown(e, saveButtonRef)} id="reason-visitor" value={visitor.reason} onChange={(e) => setVisitor({ ...visitor, reason: e.target.value })} className="col-span-3" />
                </div>

                 <DialogFooter className="col-span-1 md:col-span-2 pt-4">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button ref={saveButtonRef} onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </div>
        </div>
    );
}

export function VisitorDashboard({ 
  visitors, 
  setVisitors, 
  accessLogs, 
  setAccessLogs 
}: { 
  visitors: Visitor[], 
  setVisitors: Dispatch<SetStateAction<Visitor[]>>, 
  accessLogs: AccessLog[], 
  setAccessLogs: Dispatch<SetStateAction<AccessLog[]>> 
}) {
  return (
    <div className="container mx-auto">
        <VisitorTable 
            visitors={visitors} 
            setVisitors={setVisitors} 
            accessLogs={accessLogs}
            setAccessLogs={setAccessLogs}
        />
    </div>
  );
}
 
