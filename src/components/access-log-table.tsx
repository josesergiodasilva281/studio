
"use client";

import { useEffect, useState } from 'react';
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
import type { AccessLog, Employee } from '@/lib/types';
import { Input } from './ui/input';
import { LogIn, LogOut, Building, Home } from 'lucide-react';

// Combine Log with Employee details
type EnrichedAccessLog = AccessLog & Partial<Omit<Employee, 'id' | 'name'>>;

export function AccessLogTable() {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Load data from localStorage on initial render
    useEffect(() => {
        const loadData = () => {
            try {
                const storedLogs = localStorage.getItem('accessLogs');
                if (storedLogs) {
                    setAccessLogs(JSON.parse(storedLogs));
                }
                const storedEmployees = localStorage.getItem('employees');
                 if (storedEmployees) {
                    setEmployees(JSON.parse(storedEmployees));
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
    
    const enrichedLogs: EnrichedAccessLog[] = accessLogs
        .filter(log => log.personType === 'employee')
        .map(log => {
            const employee = employees.find(e => e.id === log.personId);
            return {
                ...log,
                department: employee?.department,
                plate: employee?.plate,
                ramal: employee?.ramal,
                status: employee?.status,
            };
        })
        .filter(log => {
            const presenceStatus = log.type === 'Entrada' ? 'Dentro' : 'Fora';
            const searchTermLower = searchTerm.toLowerCase();

            return (
                log.personName.toLowerCase().includes(searchTermLower) ||
                log.personId.toLowerCase().includes(searchTermLower) ||
                (log.department && log.department.toLowerCase().includes(searchTermLower)) ||
                (log.plate && log.plate.toLowerCase().includes(searchTermLower)) ||
                (log.ramal && log.ramal.toLowerCase().includes(searchTermLower)) ||
                (log.status && log.status.toLowerCase().includes(searchTermLower)) ||
                log.timestamp.toLowerCase().includes(searchTermLower) ||
                log.type.toLowerCase().includes(searchTermLower) ||
                presenceStatus.toLowerCase().includes(searchTermLower)
            );
        });

    return (
        <div className="container mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Acessos de Funcionários</CardTitle>
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
                                    <TableHead>Matrícula</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Setor</TableHead>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Ramal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Data e Hora</TableHead>
                                    <TableHead>Presença no Momento</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrichedLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center">
                                            Nenhum registro de acesso encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    enrichedLogs.map((log) => {
                                        const presence = log.type === 'Entrada' ? 'Dentro' : 'Fora';
                                        return (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.personId}</TableCell>
                                            <TableCell>{log.personName}</TableCell>
                                            <TableCell>{log.department || '-'}</TableCell>
                                            <TableCell>{log.plate || '-'}</TableCell>
                                            <TableCell>{log.ramal || '-'}</TableCell>
                                            <TableCell>
                                                {log.status ? (
                                                    <Badge variant={log.status === 'Ativo' ? 'default' : 'destructive'}>
                                                        {log.status}
                                                    </Badge>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={log.type === 'Entrada' ? 'default' : 'secondary'} className="flex items-center w-fit">
                                                     {log.type === 'Entrada' ? <LogIn className="mr-1 h-3 w-3" /> : <LogOut className="mr-1 h-3 w-3" />}
                                                    <span>{log.type}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{log.timestamp}</TableCell>
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
