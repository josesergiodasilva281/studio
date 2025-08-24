
"use client";

import { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Html5Qrcode } from 'html5-qrcode';
import type { Employee, Visitor, AccessLog } from '@/lib/types';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';


function AccessControl({ employees, visitors, onNewLog, onAddEmployeeClick }: { employees: Employee[], visitors: Visitor[], onNewLog: (log: Omit<AccessLog, 'type' | 'id'>) => void, onAddEmployeeClick: () => void }) {
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
            onNewLog({
                personId: person.id,
                personName: person.name,
                personType: personType,
                timestamp: new Date().toLocaleString('pt-BR'),
            });
        }
        
        setTimeout(() => setIsScannerPaused(false), 2000);
    };

    useEffect(() => {
        if (selectedDeviceId && readerRef.current && !cleanupCalledRef.current) {
            if (!scannerRef.current) {
                 scannerRef.current = new Html5Qrcode(readerRef.current.id, { verbose: false });
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
                    if (!cleanupCalledRef.current) {
                        console.error("Unable to start scanning.", err);
                    }
                });
            }
        }

        return () => {
             if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.warn("Falha ao parar scanner na limpeza.", err));
             }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDeviceId, employees, visitors, isScannerPaused]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Controle de Acesso</CardTitle>
                    <CardDescription>Use a câmera para ler QR codes ou códigos de barra.</CardDescription>
                </div>
                <Button onClick={onAddEmployeeClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Cadastrar Funcionário
                </Button>
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
    );
}


export function AccessControlManager({ onAddEmployeeClick, accessLogs, setAccessLogs }: { onAddEmployeeClick: () => void, accessLogs: AccessLog[], setAccessLogs: Dispatch<SetStateAction<AccessLog[]>> }) {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    
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

    const handleNewLog = (logData: Omit<AccessLog, 'type' | 'id'>) => {
         const personLogs = accessLogs
            .filter(log => log.personId === logData.personId)
            .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

        const lastLog = personLogs[0];
        const newLogType = !lastLog || lastLog.type === 'Saída' ? 'Entrada' : 'Saída';

        const newLog: AccessLog = {
            ...logData,
            id: new Date().toISOString(),
            type: newLogType,
        };

        setAccessLogs([newLog, ...accessLogs]);
        toast({
            title: `Acesso Registrado: ${newLog.type}`,
            description: `${newLog.personName} - ${newLog.timestamp}`,
            variant: newLog.type === 'Entrada' ? 'default' : 'destructive'
        });
    };

  return (
    <div className="container mx-auto max-w-xl">
      <AccessControl employees={employees} visitors={visitors} onNewLog={handleNewLog} onAddEmployeeClick={onAddEmployeeClick} />
    </div>
  );
}
