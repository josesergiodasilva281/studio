

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
import { Pencil, Trash2, GanttChartSquare, Camera, Home, Building, LogIn, CalendarIcon, User, Crop, Mic, Upload } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import type { Employee, AccessLog } from '@/lib/types';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getEmployeesFromFirestore, addEmployeeToFirestore, updateEmployeeInFirestore, deleteEmployeeFromFirestore, addInitialEmployeesToFirestore, addOrUpdateAccessLogInFirestore } from '@/lib/firestoreService';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


// Helper function to check if an employee should be considered active
export const isEmployeeEffectivelyActive = (employee: Employee | null): boolean => {
    if (!employee) return false;
    if (employee.status === 'Ativo') return true;
    if (employee.status === 'Inativo') {
        if (!employee.inactiveUntil) return false; // Inativo indefinidamente
        // A data é armazenada como YYYY-MM-DD. Adicionamos 1 dia para a reativação.
        const reactivationDate = new Date(employee.inactiveUntil + 'T00:00:00');
        reactivationDate.setDate(reactivationDate.getDate() + 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normaliza para o início do dia
        return today >= reactivationDate;
    }
    return false;
};

const emptyEmployee: Employee = {
    id: '',
    name: '',
    department: '',
    plate: '',
    ramal: '',
    status: 'Ativo',
    portaria: 'Nenhuma',
    inactiveUntil: null,
    photoDataUrl: '',
};

function getCroppedImg(image: HTMLImageElement, crop: CropType, canvas: HTMLCanvasElement) {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );
    
    return canvas.toDataURL('image/jpeg');
}


function PhotoCaptureAndCrop({ photoDataUrl, onPhotoCropped, isEditing = false }: { photoDataUrl: string | undefined, onPhotoCropped: (dataUrl: string) => void, isEditing?: boolean }) {
    const { toast } = useToast();
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [uncroppedPhoto, setUncroppedPhoto] = useState<string | null>(null);
    const [crop, setCrop] = useState<CropType>();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCameraOpen) {
            setUncroppedPhoto(null);
            const getCameraPermission = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
                setUncroppedPhoto(dataUrl);
                setIsCameraOpen(false); // Close camera after taking photo
            }
        }
    };
    
    const handleCropImage = () => {
        if (imgRef.current && canvasRef.current && crop) {
            const croppedDataUrl = getCroppedImg(imgRef.current, crop, canvasRef.current);
            if(croppedDataUrl) {
                onPhotoCropped(croppedDataUrl);
            }
            setUncroppedPhoto(null);
        }
    }
    
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
            width,
            height
        );
        setCrop(newCrop);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setUncroppedPhoto(reader.result as string);
            });
            reader.readAsDataURL(file);
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4 flex flex-col items-center">
            <Label>Foto do Funcionário</Label>
            <div className="w-full max-w-xs aspect-square rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                {isCameraOpen ? (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
                ) : uncroppedPhoto ? (
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        aspect={1}
                        className="max-h-[320px]"
                    >
                        <img ref={imgRef} src={uncroppedPhoto} onLoad={onImageLoad} alt="Recortar foto" />
                    </ReactCrop>
                ) : photoDataUrl ? (
                    <img src={photoDataUrl} alt="Foto do Funcionário" className="w-full h-full object-cover" />
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
                {!uncroppedPhoto && (
                     <>
                        <Button type="button" onClick={() => setIsCameraOpen(!isCameraOpen)}>
                            <Camera className="mr-2 h-4 w-4" />
                            {isCameraOpen ? 'Fechar Câmera' : (isEditing ? 'Trocar Foto' : 'Abrir Câmera')}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleUploadClick}>
                           <Upload className="mr-2 h-4 w-4" />
                           Carregar Foto
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                     </>
                )}
                {isCameraOpen && hasCameraPermission && (
                    <Button type="button" onClick={handleTakePhoto}>Tirar Foto</Button>
                )}
                {uncroppedPhoto && (
                    <>
                        <Button type="button" onClick={handleCropImage}><Crop className="mr-2 h-4 w-4"/>Recortar e Salvar Foto</Button>
                        <Button type="button" variant="outline" onClick={() => setUncroppedPhoto(null)}>Cancelar</Button>
                    </>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

function AddEmployeeDialog({ open, onOpenChange, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (employee: Employee) => void }) {
    const { toast } = useToast();
    const [newEmployee, setNewEmployee] = useState(emptyEmployee);

    const idInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const departmentInputRef = useRef<HTMLInputElement>(null);
    const plateInputRef = useRef<HTMLInputElement>(null);
    const ramalInputRef = useRef<HTMLInputElement>(null);
    const portariaTriggerRef = useRef<HTMLButtonElement>(null);
    const statusTriggerRef = useRef<HTMLButtonElement>(null);
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
         if (!newEmployee.photoDataUrl) {
            toast({ variant: 'destructive', title: 'Campo Obrigatório', description: 'A foto do funcionário é obrigatória.' });
            return;
         }
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
                </DialogHeader>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <PhotoCaptureAndCrop
                        photoDataUrl={newEmployee.photoDataUrl}
                        onPhotoCropped={(dataUrl) => setNewEmployee({ ...newEmployee, photoDataUrl: dataUrl })}
                    />
                    {/* Coluna do Formulário */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id" className="text-right">Matrícula</Label>
                            <Input ref={idInputRef} onKeyDown={(e) => handleKeyDown(e, nameInputRef)} id="id" value={newEmployee.id} onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})} className="col-span-3" />
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
                         <DialogFooter className="col-span-1 md:col-span-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button ref={saveButtonRef} type="submit" onClick={handleSaveClick}>Salvar</Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function EditEmployeeDialog({ 
    open, 
    onOpenChange, 
    employee, 
    onSave, 
    role 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    employee: Employee | null,     onSave: (employee: Employee) => void,
    role: 'rh' | 'portaria' 
}) {
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(employee);

    useEffect(() => {
        setSelectedEmployee(employee);
    }, [open, employee]);


    const handleSaveClick = () => {
        if (selectedEmployee) {
            onSave(selectedEmployee);
        }
    };
    
    if (!selectedEmployee) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Funcionário</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                     <PhotoCaptureAndCrop
                        photoDataUrl={selectedEmployee.photoDataUrl}
                        onPhotoCropped={(dataUrl) => setSelectedEmployee({ ...selectedEmployee, photoDataUrl: dataUrl })}
                        isEditing={true}
                    />
                    {/* Coluna do Formulário */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id-edit" className="text-right">Matrícula</Label>
                            <Input id="id-edit" value={selectedEmployee.id} className="col-span-3" disabled />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name-edit" className="text-right">Nome</Label>
                            <Input id="name-edit" value={selectedEmployee.name} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department-edit" className="text-right">Setor</Label>
                            <Input id="department-edit" value={selectedEmployee.department} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plate-edit" className="text-right">Placa</Label>
                            <Input id="plate-edit" value={selectedEmployee.plate} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, plate: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="ramal-edit" className="text-right">Ramal</Label>
                            <Input id="ramal-edit" value={selectedEmployee.ramal} onChange={(e) => setSelectedEmployee({ ...selectedEmployee, ramal: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="portaria-edit" className="text-right">Portaria</Label>
                            <Select value={selectedEmployee.portaria} onValueChange={(value: 'Nenhuma' | 'P1' | 'P2') => setSelectedEmployee({ ...selectedEmployee, portaria: value })}>
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
                            <Select disabled={role !== 'rh'} value={selectedEmployee.status} onValueChange={(value: 'Ativo' | 'Inativo') => setSelectedEmployee({ ...selectedEmployee, status: value })}>
                                <SelectTrigger id="status-edit" className="col-span-3">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                    <SelectItem value="Inativo">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedEmployee.status === 'Inativo' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="inactiveUntil-edit" className="text-right">Inativo até</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "col-span-3 justify-start text-left font-normal",
                                                !selectedEmployee.inactiveUntil && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedEmployee.inactiveUntil ? format(parseISO(selectedEmployee.inactiveUntil), "dd/MM/yyyy") : <span>Selecione a data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedEmployee.inactiveUntil ? parseISO(selectedEmployee.inactiveUntil) : undefined}
                                            onSelect={(date) => setSelectedEmployee({ ...selectedEmployee, inactiveUntil: date ? format(date, 'yyyy-MM-dd') : null })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
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

type FilterType = 'all' | 'id' | 'name' | 'department' | 'plate' | 'ramal' | 'portaria' | 'status' | 'presence';

const searchKeywords: Record<string, FilterType> = {
    matrícula: 'id',
    matricula: 'id',
    nome: 'name',
    setor: 'department',
    placa: 'plate',
    ramal: 'ramal',
    portaria: 'portaria',
    status: 'status',
    presença: 'presence',
    presenca: 'presence',
};


function EmployeeTable({ employees, setEmployees, isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen, accessLogs, setAccessLogs, role }: { employees: Employee[], setEmployees: (employees: Employee[]) => void, isAddEmployeeDialogOpen: boolean, setIsAddEmployeeDialogOpen: Dispatch<SetStateAction<boolean>>, accessLogs: AccessLog[], setAccessLogs: Dispatch<SetStateAction<AccessLog[]>>, role: 'rh' | 'portaria' }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const { toast } = useToast();
    const { user } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    
    // Function to remove accents and convert to lower case
    const normalizeString = (str: string) => {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const handleManualEntry = async (employee: Employee) => {
        if (!user) return;

        if (!isEmployeeEffectivelyActive(employee)) {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: `Funcionário ${employee.name} está inativo.` });
            return;
        }

        const openLog = accessLogs.find(
            log => log.personId === employee.id && log.exitTimestamp === null
        );

        if (openLog) {
            toast({
                title: "Acesso já registrado",
                description: `${employee.name} já possui um registro de entrada. A saída deve ser registrada no histórico.`,
                variant: 'default'
            });
        } else {
            // Registering an entry
            const registeredBy = getRegisteredBy();
            const newLog: AccessLog = {
                id: `log-${Date.now()}`,
                personId: employee.id,
                personName: employee.name,
                personType: 'employee',
                entryTimestamp: new Date().toISOString(),
                exitTimestamp: null,
                registeredBy,
                photoDataUrl: employee.photoDataUrl,
            };
            await addOrUpdateAccessLogInFirestore((newLog));
            setAccessLogs(prevLogs => [newLog, ...prevLogs]);
            toast({
                title: "Acesso Registrado: Entrada",
                description: `${employee.name} - ${new Date(newLog.entryTimestamp).toLocaleString('pt-BR')}`,
                variant: 'default'
            });
            // Clear search after successful registration
            setSearchTerm('');
            setFilterType('all');
        }
    };
    
    useEffect(() => {
        const normalizedSearchTerm = normalizeString(searchTerm);

        const results = employees.filter(employee => {
            if (!normalizedSearchTerm) return true;

            const searchWords = normalizedSearchTerm.split(' ').filter(w => w.length > 0);
            const presenceStatus = getPresenceStatus(employee.id);

            const checkField = (field: keyof Employee | 'presence') => {
                if (field === 'presence') {
                    return normalizeString(presenceStatus).includes(normalizedSearchTerm);
                }

                const value = employee[field];
                const normalizedValue = value ? normalizeString(String(value)) : '';
                
                // Special logic for name: check if all search words are in the name
                if (field === 'name') {
                    return searchWords.every(word => normalizedValue.includes(word));
                }

                // Default logic for other fields
                return normalizedValue.includes(normalizedSearchTerm);
            };

            if (filterType !== 'all') {
                return checkField(filterType);
            }
            
            // 'all' fields search
            return (
                checkField('id') ||
                checkField('name') ||
                checkField('department') ||
                checkField('plate') ||
                checkField('ramal') ||
                checkField('portaria') ||
                checkField('status') ||
                checkField('presence')
            );
        });
        setFilteredEmployees(results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filterType, employees, accessLogs]);
    
    useEffect(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Listen continuously
            recognitionRef.current.lang = 'pt-BR';
            recognitionRef.current.interimResults = false;
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onresult = (event: any) => {
                const lastResultIndex = event.results.length - 1;
                const transcript = normalizeString(event.results[lastResultIndex][0].transcript.trim());

                if (transcript.startsWith('ok')) {
                    const command = transcript.substring('ok'.length).trim();

                    if (command === 'registrar') {
                        if (filteredEmployees.length === 1) {
                            handleManualEntry(filteredEmployees[0]);
                        } else if (filteredEmployees.length > 1) {
                             toast({
                                variant: 'destructive',
                                title: 'Muitos resultados',
                                description: 'Refine sua busca para que apenas um funcionário apareça na lista antes de registrar.',
                            });
                        } else {
                             toast({
                                variant: 'destructive',
                                title: 'Nenhum resultado',
                                description: 'Nenhum funcionário encontrado para registrar.',
                            });
                        }
                    } else {
                        const words = command.split(' ');
                        const keyword = words[0];
                        const foundKeyword = Object.keys(searchKeywords).find(k => normalizeString(k) === keyword);

                        if (foundKeyword) {
                            setFilterType(searchKeywords[foundKeyword]);
                            setSearchTerm(words.slice(1).join(' '));
                        } else {
                            setFilterType('all');
                            setSearchTerm(command);
                        }
                    }
                } else if (transcript === 'registrar') {
                     if (filteredEmployees.length === 1) {
                        handleManualEntry(filteredEmployees[0]);
                    } else if (filteredEmployees.length > 1) {
                         toast({
                            variant: 'destructive',
                            title: 'Muitos resultados',
                            description: 'Refine sua busca para que apenas um funcionário apareça na lista antes de registrar.',
                        });
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    toast({
                        variant: 'destructive',
                        title: 'Permissão do Microfone Negada',
                        description: 'Por favor, permita o acesso ao microfone nas configurações do seu navegador para usar a pesquisa por voz.',
                    });
                     setIsListening(false);
                } else {
                    // Other errors might be temporary, don't show a toast unless it's persistent.
                }
            };
            
             recognitionRef.current.onend = () => {
                 if(isListening){
                    try {
                        recognitionRef.current.start();
                    } catch(e) {
                         console.error("Could not restart recognition", e);
                         setIsListening(false);
                    }
                 }
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast, filteredEmployees]);
    
    const handleVoiceSearch = () => {
        if (!recognitionRef.current) {
            toast({ variant: 'destructive', title: 'Navegador não suportado', description: 'O reconhecimento de voz não é suportado por este navegador.' });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error: any) {
                 console.error("Error starting speech recognition:", error);
                 if (error.name === 'NotAllowedError') {
                      toast({
                        variant: 'destructive',
                        title: 'Permissão do Microfone Negada',
                        description: 'Por favor, permita o acesso ao microfone nas configurações do seu navegador.',
                    });
                 } else {
                    toast({
                        variant: 'destructive',
                        title: 'Não foi possível iniciar o reconhecimento de voz',
                    });
                 }
                setIsListening(false);
            }
        }
    };
    
    const getRegisteredBy = (): 'RH' | 'P1' | 'P2' | 'Supervisor' => {
        if (!user) return 'P1'; // Should not happen
        if (user.role === 'rh') return 'RH';
        if (user.role === 'supervisor') return 'Supervisor';
        if (user.username === 'portaria1') return 'P1';
        if (user.username === 'portaria2') return 'P2';
        return 'P1'; // Default, should not happen
    }

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

    const handleSave = async (employeeToSave: Employee) => {
        try {
            // Se o status for Ativo, limpa a data de inatividade
            if (employeeToSave.status === 'Ativo') {
                employeeToSave.inactiveUntil = null;
            }

            await updateEmployeeInFirestore(employeeToSave);
            setEmployees(employees.map(e => e.id === employeeToSave.id ? employeeToSave : e));
            setIsEditDialogOpen(false);
            setSelectedEmployee(null);
            toast({ title: 'Funcionário atualizado com sucesso!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar funcionário' });
            console.error(error);
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


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle>Funcionários</CardTitle>
          <Link href="/employees/history">
            <Button variant="outline" className="w-full sm:w-auto">
              <GanttChartSquare className="mr-2 h-4 w-4" />
              Ver Histórico
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
           <div className="flex items-center py-4 gap-2">
            <Input
                placeholder="Use a voz com 'OK...' ou digite aqui"
                value={searchTerm}
                onChange={(event) => {
                    setSearchTerm(event.target.value)
                    setFilterType('all')
                }}
                className="max-w-full sm:max-w-sm"
            />
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handleVoiceSearch}
                className={cn(isListening && "bg-red-500 hover:bg-red-600 text-white")}
                title="Ativar/desativar busca por voz"
            >
                <Mic className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Foto</TableHead>
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
                        const isEffectivelyActive = isEmployeeEffectivelyActive(employee);
                        const displayStatus = isEffectivelyActive ? 'Ativo' : 'Inativo';
                        
                        return (
                        <TableRow 
                            key={employee.id}
                            className={cn(
                                presence === 'Dentro' && 'bg-red-950 hover:bg-red-900'
                            )}
                        >
                        <TableCell>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Avatar className="cursor-pointer">
                                        <AvatarImage src={employee.photoDataUrl} alt={employee.name} />
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                </DialogTrigger>
                                <DialogContent className="p-0 max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="sr-only">{`Foto de ${employee.name}`}</DialogTitle>
                                    </DialogHeader>
                                    {employee.photoDataUrl ? (
                                        <img src={employee.photoDataUrl} alt={`Foto de ${employee.name}`} className="w-full h-auto rounded-md" />
                                    ) : (
                                        <div className="flex items-center justify-center h-96 bg-muted">
                                            <User className="h-24 w-24 text-muted-foreground" />
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </TableCell>
                        <TableCell 
                            className="cursor-pointer hover:underline"
                            onClick={() => handleManualEntry(employee)}
                        >
                            {employee.id}
                        </TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.plate}</TableCell>
                        <TableCell>{employee.ramal}</TableCell>
                        <TableCell>{employee.portaria && employee.portaria !== 'Nenhuma' ? employee.portaria : '-'}</TableCell>
                        <TableCell>
                            <Badge variant={displayStatus === 'Ativo' ? 'default' : 'destructive'}>
                                {displayStatus}
                                {employee.status === 'Inativo' && !isEffectivelyActive && employee.inactiveUntil && (
                                    <span className="ml-1.5 text-xs"> (até {format(parseISO(employee.inactiveUntil), 'dd/MM/yy')})</span>
                                )}
                            </Badge>
                        </TableCell>
                        <TableCell>
                             <Badge
                                variant={presence === 'Dentro' ? 'default' : 'destructive'}
                                className={cn(presence === 'Dentro' && 'bg-white text-black')}
                             >
                                {presence === 'Dentro' ? <Building className="mr-1 h-3 w-3" /> : <Home className="mr-1 h-3 w-3" />}
                                {presence}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleManualEntry(employee)} title="Registrar Entrada Manual">
                                <LogIn className="h-4 w-4" />
                            </Button>
                            {role === 'rh' && (
                                <>
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
                                </>
                            )}
                        </TableCell>
                        </TableRow>
                    )})}
                    </TableBody>
                </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddEmployeeDialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen} onSave={handleAddNewEmployee} />

      <EditEmployeeDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        employee={selectedEmployee}
        onSave={handleSave}
        role={role}
      />
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
    <div className="container mx-auto px-0 sm:px-4">
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


    


