
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { LogIn, LogOut } from 'lucide-react';

export function AccessLogTable() {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

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
    
    const employeeLogs = accessLogs
        .filter(log => log.personType === 'employee')
        .filter(log => 
            log.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.type.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="container mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Acessos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Filtrar histórico..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome do Funcionário</TableHead>
                                    <TableHead>Data e Hora</TableHead>
                                    <TableHead>Tipo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employeeLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">
                                            Nenhum registro de acesso encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employeeLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.personName}</TableCell>
                                            <TableCell>{log.timestamp}</TableCell>
                                            <TableCell>
                                                <Badge variant={log.type === 'Entrada' ? 'default' : 'secondary'} className="flex items-center w-fit">
                                                     {log.type === 'Entrada' ? <LogIn className="mr-1 h-3 w-3" /> : <LogOut className="mr-1 h-3 w-3" />}
                                                    <span>{log.type}</span>
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
