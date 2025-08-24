

"use client";

import { useEffect, useState, KeyboardEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from './ui/badge';
import type { AccessLog } from '@/lib/types';
import { Input } from './ui/input';
import { Building, Home, User } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';


export function VisitorAccessLogTable() {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');

    // Load data from localStorage on initial render
    useEffect(() => {
        const loadData = () => {
            try {
                const storedLogs = localStorage.getItem('accessLogs');
                if (storedLogs) {
                    setAccessLogs(JSON.parse(storedLogs).filter((log: AccessLog) => log.personType === 'visitor'));
                }
            } catch (error) {
                console.error("Error reading from localStorage", error);
            }
        };
        
        loadData();

        // Listen for custom event to reload logs
        const handleStorageChange = () => loadData();
        window.addEventListener('storage', handleStorageChange);
        
        // Cleanup listener
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);
    
    const filteredLogs: AccessLog[] = accessLogs
        .filter(log => {
            if (!searchTerm) return true; // Return all logs if search is empty
            const searchTermLower = searchTerm.toLowerCase();

            return (
                (log.personName && log.personName.toLowerCase().includes(searchTermLower)) ||
                (log.rg && log.rg.toLowerCase().includes(searchTermLower)) ||
                (log.cpf && log.cpf.toLowerCase().includes(searchTermLower)) ||
                (log.company && log.company.toLowerCase().includes(searchTermLower)) ||
                (log.plate && log.plate.toLowerCase().includes(searchTermLower)) ||
                (log.responsible && log.responsible.toLowerCase().includes(searchTermLower)) ||
                (log.reason && log.reason.toLowerCase().includes(searchTermLower)) ||
                (log.entryTimestamp && log.entryTimestamp.toLowerCase().includes(searchTermLower)) ||
                (log.exitTimestamp && log.exitTimestamp.toLowerCase().includes(searchTermLower))
            );
        });

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            setSearchTerm(inputValue);
        }
    };

    return (
        <div className="container mx-auto">
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>HISTÓRICO</CardTitle>
                    <Link href="/dashboard">
                        <Button variant="outline">Voltar</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Filtrar histórico..."
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
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Responsável</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Entrada</TableHead>
                                    <TableHead>Saída</TableHead>
                                    <TableHead>Presença</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center">
                                            Nenhum registro de acesso encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => {
                                        const presence = log.exitTimestamp === null ? 'Dentro' : 'Fora';
                                        return (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Avatar className="cursor-pointer">
                                                            <AvatarImage src={log.photoDataUrl} alt={log.personName} />
                                                            <AvatarFallback><User /></AvatarFallback>
                                                        </Avatar>
                                                    </DialogTrigger>
                                                    <DialogContent className="p-0 max-w-lg">
                                                        <DialogHeader>
                                                            <DialogTitle className="sr-only">{`Foto de ${log.personName}`}</DialogTitle>
                                                        </DialogHeader>
                                                        <img src={log.photoDataUrl} alt={`Foto de ${log.personName}`} className="w-full h-auto rounded-md" />
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                            <TableCell>{log.personName}</TableCell>
                                            <TableCell>{log.rg || '-'}</TableCell>
                                            <TableCell>{log.cpf || '-'}</TableCell>
                                            <TableCell>{log.company || '-'}</TableCell>
                                            <TableCell>{log.plate || '-'}</TableCell>
                                            <TableCell>{log.responsible || '-'}</TableCell>
                                            <TableCell>{log.reason || '-'}</TableCell>
                                            <TableCell>{log.entryTimestamp}</TableCell>
                                            <TableCell>{log.exitTimestamp || '-'}</TableCell>
                                            <TableCell>
                                                 <Badge 
                                                    variant={presence === 'Dentro' ? 'default' : 'destructive'}
                                                 >
                                                    {presence === 'Dentro' ? <Building className="mr-1 h-3 w-3" /> : <Home className="mr-1 h-3 w-3" />}
                                                    {presence}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )})
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
