
"use client";

import { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { PlusCircle, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';


function AccessControlUI({ 
    onAddEmployeeClick, 
    isScannerOpen, 
    handleDialogOpenChange, 
    devices, 
    selectedDeviceId, 
    setSelectedDeviceId, 
    readerRef 
}: { 
    onAddEmployeeClick: () => void,
    isScannerOpen: boolean,
    handleDialogOpenChange: (open: boolean) => void,
    devices: MediaDeviceInfo[],
    selectedDeviceId: string,
    setSelectedDeviceId: Dispatch<SetStateAction<string>>,
    readerRef: React.RefObject<HTMLDivElement>
}) {
    return (
      <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-end p-4">
                 <div className="flex items-center gap-2">
                    <Button onClick={() => handleDialogOpenChange(true)}>
                        <Camera className="mr-2 h-4 w-4" />
                        Abrir Leitor
                    </Button>
                    <Button onClick={onAddEmployeeClick} variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Cadastrar Funcionário
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground p-8">
                    Clique em "Abrir Leitor" para usar a câmera ou use um leitor de código de barras externo.
                </div>
            </CardContent>
        </Card>
        <Dialog open={isScannerOpen} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="sm:max-w-xl">
                 <DialogHeader>
                    <DialogTitle>Leitor de QR Code</DialogTitle>
                    <DialogDescription>Aponte a câmera para o código. O leitor permanecerá aberto para múltiplas leituras.</DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
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
                    <div id="reader-main" ref={readerRef} className="w-full aspect-video rounded-md bg-black overflow-hidden" />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
}


export function AccessControlManager({ onAddEmployeeClick, accessLogs, setAccessLogs }: { onAddEmployeeClick: () => void, accessLogs: AccessLog[], setAccessLogs: Dispatch<SetStateAction<AccessLog[]>> }) {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerRef = useRef<HTMLDivElement>(null);
    const [isScannerPaused, setIsScannerPaused] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // For external barcode scanner (keyboard input)
    const [barcodeScanInput, setBarcodeScanInput] = useState('');
    const barcodeScanTimer = useRef<NodeJS.Timeout | null>(null);

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
        const loadVisitors = () => {
            try {
                const storedVisitors = localStorage.getItem('visitors');
                if (storedVisitors) {
                    setVisitors(JSON.parse(storedVisitors));
                }
            } catch (error) {
                console.error("Error reading visitors from localStorage", error);
            }
        };
        loadVisitors();
        // Also listen for changes from other tabs/windows
        window.addEventListener('storage', loadVisitors);
        return () => window.removeEventListener('storage', loadVisitors);
    }, []);

    const processScan = (scannedCode: string) => {
        if (!scannedCode) return;

        const employee = employees.find(e => e.id === scannedCode);
        const visitor = visitors.find(v => v.id === scannedCode);
        let person: Employee | Visitor | undefined = employee || visitor;
        let personType: 'employee' | 'visitor' | undefined = employee ? 'employee' : (visitor ? 'visitor' : undefined);

        if (!person || !personType) {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Pessoa não encontrada.' });
        } else if (personType === 'employee' && (person as Employee).status === 'Inativo') {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: `Funcionário ${person.name} está inativo.` });
        } else {
            handleNewLog(person, personType);
        }
    };


     const handleNewLog = (person: Employee | Visitor, personType: 'employee' | 'visitor') => {
        const openLog = accessLogs.find(
            log => log.personId === person.id && log.exitTimestamp === null
        );

        if (openLog) {
            // Registering an exit
            const updatedLogs = accessLogs.map(log => 
                log.id === openLog.id 
                ? { ...log, exitTimestamp: new Date().toLocaleString('pt-BR') }
                : log
            );
            setAccessLogs(updatedLogs);
            toast({
                title: "Acesso Registrado: Saída",
                description: `${person.name} - ${new Date().toLocaleString('pt-BR')}`,
                variant: 'destructive'
            });
        } else {
            // Registering an entry
            const newLog: AccessLog = {
                id: `log-${Date.now()}`,
                personId: person.id,
                personName: person.name,
                personType: personType,
                entryTimestamp: new Date().toLocaleString('pt-BR'),
                exitTimestamp: null,
                // Snapshot visitor details if it's a visitor
                ...(personType === 'visitor' && {
                    reason: (person as Visitor).reason,
                    responsible: (person as Visitor).responsible,
                    photoDataUrl: (person as Visitor).photoDataUrl,
                    rg: (person as Visitor).rg,
                    cpf: (person as Visitor).cpf,
                    company: (person as Visitor).company,
                    plate: (person as Visitor).plate,
                }),
            };
            setAccessLogs(prevLogs => [newLog, ...prevLogs]);
            toast({
                title: "Acesso Registrado: Entrada",
                description: `${person.name} - ${newLog.entryTimestamp}`,
                variant: 'default'
            });
        }
    };
    
    // Camera Scanner Logic
    useEffect(() => {
        if (!isScannerOpen) {
            return;
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScannerOpen]);
    
    const stopScanner = () => {
        if (scannerRef.current) {
            const scanner = scannerRef.current;
            scannerRef.current = null; // Clear ref immediately
            if (scanner.isScanning) {
                scanner.stop().catch(err => {
                    console.warn("Scanner could not be stopped, likely already stopped.", err);
                });
            }
             scanner.clear();
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        if (isScannerPaused) return;
        setIsScannerPaused(true);
        processScan(decodedText);
        setTimeout(() => setIsScannerPaused(false), 2000);
    };

     useEffect(() => {
        if (isScannerOpen && selectedDeviceId && readerRef.current && !scannerRef.current) {
            const newScanner = new Html5Qrcode(readerRef.current.id, { verbose: false });
            scannerRef.current = newScanner;

            newScanner.start(
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
                toast({ variant: "destructive", title: "Erro ao iniciar a câmera." });
                scannerRef.current = null; // Reset on error
            });
            
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScannerOpen, selectedDeviceId]);

    useEffect(() => {
        // This is a cleanup effect that runs when the component unmounts.
        return () => {
             stopScanner();
        }
    }, []);


     const handleDialogOpenChange = (open: boolean) => {
        setIsScannerOpen(open);
        if (!open) {
          stopScanner();
        }
    }

    // External (keyboard-like) scanner listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if a dialog is open or if typing in an input/textarea
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('role') === 'dialog')) {
                return;
            }

            if (e.key === 'Enter') {
                if (barcodeScanInput.length > 2) { // Minimum length for a valid scan
                    processScan(barcodeScanInput);
                }
                setBarcodeScanInput(''); // Reset after processing
                return;
            }

            // Ignore special keys, except for alphanumeric and some symbols
            if (e.key.length === 1) {
                 setBarcodeScanInput(prev => prev + e.key);
            }
           

            // Reset the buffer if there's a pause in typing
            if (barcodeScanTimer.current) {
                clearTimeout(barcodeScanTimer.current);
            }
            barcodeScanTimer.current = setTimeout(() => {
                setBarcodeScanInput('');
            }, 100); // 100ms pause is usually enough to indicate end of scan
        };
        
        window.addEventListener('keydown', handleKeyDown as any);

        return () => {
            window.removeEventListener('keydown', handleKeyDown as any);
            if (barcodeScanTimer.current) {
                clearTimeout(barcodeScanTimer.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [barcodeScanInput, employees, visitors, accessLogs]);


  return (
    <div className="container mx-auto max-w-xl">
      <AccessControlUI 
        onAddEmployeeClick={onAddEmployeeClick}
        isScannerOpen={isScannerOpen}
        handleDialogOpenChange={handleDialogOpenChange}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
        readerRef={readerRef}
      />
    </div>
  );
}

    