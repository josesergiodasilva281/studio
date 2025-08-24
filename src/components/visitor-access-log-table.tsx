
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
import { LogIn, LogOut, Building, Home } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

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
                document: visitor?.document,
                company: visitor?.company,
            };
        })
        .filter(log => {
            const searchTermLower = searchTerm.toLowerCase();

            return (
                log.personName.toLowerCase().includes(searchTermLower) ||
                log.personId.toLowerCase().includes(searchTermLower) ||
                (log.document && log.document.toLowerCase().includes(searchTermLower)) ||
                (log.company && log.company.toLowerCase().includes(searchTermLower)) ||
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
                    <CardTitle>Histórico de Acessos de Visitantes</CardTitle>
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
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Data e Hora</TableHead>
                                    <TableHead>Presença</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrichedLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
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
                                            <TableCell>{log.document || '-'}</TableCell>
                                            <TableCell>{log.company || '-'}</TableCell>
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
