
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
import type { CarLog } from '@/lib/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Link from 'next/link';

export function CarAccessLogTable() {
    const [carLogs, setCarLogs] = useState<CarLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const loadData = () => {
            try {
                const storedLogs = localStorage.getItem('carLogs');
                if (storedLogs) {
                    setCarLogs(JSON.parse(storedLogs));
                }
            } catch (error) {
                console.error("Error reading from localStorage", error);
            }
        };
        
        loadData();

        const handleStorageChange = () => loadData();
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);
    
    const filteredLogs = carLogs.filter(log => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            log.carId.toLowerCase().includes(searchTermLower) ||
            log.carFleet.toLowerCase().includes(searchTermLower) ||
            log.driverName.toLowerCase().includes(searchTermLower) ||
            log.destination.toLowerCase().includes(searchTermLower) ||
            (log.notes && log.notes.toLowerCase().includes(searchTermLower))
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
                    <CardTitle>Histórico de Uso dos Carros</CardTitle>
                    <Link href="/cars">
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
                                    <TableHead>Frota</TableHead>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Motorista</TableHead>
                                    <TableHead>Destino</TableHead>
                                    <TableHead>Saída</TableHead>
                                    <TableHead>Retorno</TableHead>
                                    <TableHead>Observações</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.carFleet}</TableCell>
                                            <TableCell className="font-medium">{log.carId}</TableCell>
                                            <TableCell>{log.driverName}</TableCell>
                                            <TableCell>{log.destination}</TableCell>
                                            <TableCell>{log.startTime}</TableCell>
                                            <TableCell>{log.endTime || 'Em uso'}</TableCell>
                                            <TableCell>{log.notes || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={log.endTime ? 'default' : 'destructive'}>
                                                    {log.endTime ? 'Finalizado' : 'Em uso'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center">
                                            Nenhum registro encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
