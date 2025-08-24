
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
import type { AccessLog, Visitor } from '@/lib/types';
import { Input } from './ui/input';
import { LogIn, LogOut, Building, Home, User } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


// Combine Log with Visitor details
type EnrichedAccessLog = AccessLog & Partial<Omit<Visitor, 'id' | 'name'>>;

export function VisitorAccessLogTable() {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');

    // Load data from localStorage on initial render
    useEffect(() => {
        const loadData = () => {
            try {
                const storedLogs = localStorage.getItem('accessLogs');
                if (storedLogs) {
                    setAccessLogs(JSON.parse(storedLogs));
                }
                const storedVisitors = localStorage.getItem('visitors');
                 if (storedVisitors) {
                    setVisitors(JSON.parse(storedVisitors));
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
        .filter(log => log.personType === 'visitor')
        .map(log => {
            const visitor = visitors.find(v => v.id === log.personId);
            return {
                ...log,
                ...visitor,
            };
        })
        .filter(log => {
            const searchTermLower = searchTerm.toLowerCase();

            return (
                log.personName.toLowerCase().includes(searchTermLower) ||
                (log.rg && log.rg.toLowerCase().includes(searchTermLower)) ||
                (log.cpf && log.cpf.toLowerCase().includes(searchTermLower)) ||
                (log.company && log.company.toLowerCase().includes(searchTermLower)) ||
                (log.plate && log.plate.toLowerCase().includes(searchTermLower)) ||
                (log.responsible && log.responsible.toLowerCase().includes(searchTermLower)) ||
                (log.reason && log.reason.toLowerCase().includes(searchTermLower)) ||
                log.timestamp.toLowerCase().includes(searchTermLower) ||
                log.type.toLowerCase().includes(searchTermLower)
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
                                    <TableHead>Motivo da Visita</TableHead>
                                    <TableHead>Data e Hora</TableHead>
                                    <TableHead>Presença</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrichedLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center">
                                            Nenhum registro de acesso encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    enrichedLogs.map((log) => {
                                        const presence = log.type === 'Entrada' ? 'Dentro' : 'Fora';
                                        return (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <Avatar>
                                                    <AvatarImage src={log.photoDataUrl} alt={log.personName} />
                                                    <AvatarFallback><User /></AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>{log.personName}</TableCell>
                                            <TableCell>{log.rg || '-'}</TableCell>
                                            <TableCell>{log.cpf || '-'}</TableCell>
                                            <TableCell>{log.company || '-'}</TableCell>
                                            <TableCell>{log.plate || '-'}</TableCell>
                                            <TableCell>{log.responsible || '-'}</TableCell>
                                            <TableCell>{log.reason || '-'}</TableCell>
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
