
"use client";

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogIn, LogOut, User, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Html5Qrcode } from 'html5-qrcode';
import { Badge } from './ui/badge';
import type { Employee, Visitor, AccessLog } from '@/lib/types';


function AccessControl({ employees, visitors, accessLogs, setAccessLogs }: { employees: Employee[], visitors: Visitor[], accessLogs: AccessLog[], setAccessLogs: (logs: AccessLog[]) => void }) {
    const { toast } = useToast();
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerRef = useRef<HTMLDivElement>(null);
    const [isScannerPaused, setIsScannerPaused] = useState(false);
    const cleanupCalledRef = useRef(false);

    useEffect(() => {
        cleanupCalledRef.current = false;
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
        
         return () => {
            cleanupCalledRef.current = true;
             if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.warn("Falha ao parar scanner.", err));
             }
         }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => {
                console.warn("Scanner could not be stopped.", err);
            });
        }
    };
    
    const handleScanSuccess = (decodedText: string) => {
        if (isScannerPaused) return;

        setIsScannerPaused(true);

        const employee = employees.find(e => e.id === decodedText);
        const visitor = visitors.find(v => v.id === decodedText);
        let person: Employee | Visitor | undefined = employee || visitor;
        let personType: 'employee' | 'visitor' | undefined = employee ? 'employee' : (visitor ? 'visitor' : undefined);

        if (!person || !personType) {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Pessoa não encontrada.' });
        } else if (personType === 'employee' && (person as Employee).status === 'Inativo') {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: `Funcionário ${person.name} está inativo.` });
        } else {
            const personLogs = accessLogs
                .filter(log => log.personId === person!.id)
                .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

            const lastLog = personLogs[0];
            const newLogType = !lastLog || lastLog.type === 'Saída' ? 'Entrada' : 'Saída';
            
            const newLog: AccessLog = {
                id: new Date().toISOString(),
                personId: person.id,
                personName: person.name,
                personType: personType,
                timestamp: new Date().toLocaleString('pt-BR'),
                type: newLogType,
            };

            setAccessLogs([newLog, ...accessLogs]);
            toast({
                title: `Acesso Registrado: ${newLogType}`,
                description: `${person.name} - ${newLog.timestamp}`,
                variant: newLogType === 'Entrada' ? 'default' : 'destructive'
            });
        }
        
        setTimeout(() => setIsScannerPaused(false), 2000);
    };

    useEffect(() => {
        if (selectedDeviceId && readerRef.current) {
            if (!scannerRef.current) {
                 scannerRef.current = new Html5Qrcode(readerRef.current.id, { verbose: false });
            }
            const html5Qrcode = scannerRef.current;
            
            // Cleanup previous scanner before starting a new one
            if (html5Qrcode.isScanning) {
                html5Qrcode.stop();
            }

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
                });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDeviceId, employees, visitors, accessLogs, isScannerPaused]);

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Controle de Acesso</CardTitle>
                    <CardDescription>Aponte o código de barras do funcionário ou visitante para a câmera para registrar a entrada ou saída.</CardDescription>
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
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead className="text-right">Acesso</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accessLogs.slice(0, 10).map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.personName}</TableCell>
                                     <TableCell>
                                        <Badge variant={log.personType === 'employee' ? 'default' : 'outline'}>
                                          {log.personType === 'employee' ? <User className="mr-1 h-3 w-3" /> : <Users className="mr-1 h-3 w-3" />}
                                          {log.personType === 'employee' ? 'Funcionário' : 'Visitante'}
                                        </Badge>
                                    </TableCell>
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


export function AccessControlManager() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

    // Load employees from localStorage on initial render
    useEffect(() => {
        try {
            const storedEmployees = localStorage.getItem('employees');
            if (storedEmployees) {
                setEmployees(JSON.parse(storedEmployees));
            }
        } catch (error) {
            console.error("Error reading employees from localStorage", error);
        }
    }, []);

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
      <AccessControl employees={employees} visitors={visitors} accessLogs={accessLogs} setAccessLogs={setAccessLogs} />
    </div>
  );
}
