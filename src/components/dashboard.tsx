
"use client";

import { useEffect, useState, useRef } from 'react';
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
import { Pencil, Trash2, PlusCircle, Camera, LogIn, LogOut, Home, Building, User, Users } from 'lucide-react';
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
import { Html5Qrcode } from 'html5-qrcode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import type { Employee, Visitor, AccessLog } from '@/lib/types';


const initialEmployees: Employee[] = [
  { id: '1', name: 'João da Silva', department: 'Produção', plate: 'ABC-1234', ramal: '2101', status: 'Ativo' },
  { id: '2', name: 'Maria Oliveira', department: 'Logística', plate: 'DEF-5678', ramal: '2102', status: 'Ativo' },
  { id: '3', name: 'Pedro Souza', department: 'Administrativo', plate: 'GHI-9012', ramal: '2103', status: 'Inativo' },
];

const emptyEmployee: Employee = {
    id: '',
    name: '',
    department: '',
    plate: '',
    ramal: '',
    status: 'Ativo',
};

const emptyVisitor: Visitor = {
    id: '',
    name: '',
    document: '',
    company: '',
};

function BarcodeScannerDialog({ open, onOpenChange, onBarcodeScan }: { open: boolean; onOpenChange: (open: boolean) => void; onBarcodeScan: (barcode: string) => void; }) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const cleanupCalledRef = useRef(false);

  useEffect(() => {
    if (open) {
      cleanupCalledRef.current = false; // Reset on open
      Html5Qrcode.getCameras().then(availableDevices => {
        if (availableDevices && availableDevices.length > 0) {
          setDevices(availableDevices);
          if(!selectedDeviceId) {
            setSelectedDeviceId(availableDevices[0].id);
          }
        } else {
            toast({ variant: "destructive", title: "Nenhuma câmera encontrada."})
        }
      }).catch(err => {
        console.error("Error getting cameras:", err);
        toast({ variant: "destructive", title: "Erro ao acessar câmeras.", description: "Por favor, verifique as permissões."})
      });
    }
  }, [open, toast, selectedDeviceId]);


  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
            console.warn("Scanner could not be stopped, likely already stopped.", err);
        });
    }
  };

  useEffect(() => {
    if (open && selectedDeviceId && readerRef.current) {
        // Ensure the div is ready.
        if (!readerRef.current) return;

        // Initialize scanner if it doesn't exist
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(readerRef.current.id, { verbose: false });
        }
        const html5Qrcode = scannerRef.current;
        
        const qrCodeSuccessCallback = (decodedText: string) => {
            onBarcodeScan(decodedText);
            onOpenChange(false); // Close dialog on successful scan
        };
        
        if (html5Qrcode && !html5Qrcode.isScanning) {
            html5Qrcode.start(
                selectedDeviceId, 
                {
                    fps: 10,
                    qrbox: { width: 350, height: 150 }
                },
                qrCodeSuccessCallback,
                () => {} // Ignore errors
            ).catch(err => {
                console.error("Unable to start scanning.", err);
            });
        }
    }

    return () => {
        if (!cleanupCalledRef.current) {
             cleanupCalledRef.current = true;
             stopScanner();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDeviceId]);

  const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
          stopScanner();
      }
      onOpenChange(isOpen);
  };

  return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                  <DialogTitle>Leitor de Código de Barras</DialogTitle>
                  <DialogDescription>
                      Selecione a câmera e aponte para o código de barras.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {devices.length > 1 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="camera-select" className="text-right">Câmera</Label>
                        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                            <SelectTrigger id="camera-select" className="col-span-3">
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
                <div id="reader-dialog" ref={readerRef} className="w-full aspect-video rounded-md bg-black" />
              </div>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  )
}
