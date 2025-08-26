

"use client";

import { useEffect, useState, KeyboardEvent } from 'react';
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
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
import { Building, Home, User, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

// Helper function to parse pt-BR date strings
const parsePtBrDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split(', ');
    if (parts.length < 2) return null;
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return null;
    return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1]}`);
};


export function VisitorAccessLogTable({ readOnly = false }: { readOnly?: boolean }) {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
     const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });

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
             // Date filtering
            const logDate = parsePtBrDate(log.entryTimestamp);
            if (!logDate) return false;
            
            const fromDate = date?.from ? new Date(date.from.setHours(0, 0, 0, 0)) : null;
            const toDate = date?.to ? new Date(date.to.setHours(23, 59, 59, 999)) : null;

            if (fromDate && logDate < fromDate) return false;
            if (toDate && logDate > toDate) return false;


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
                (log.exitTimestamp && log.exitTimestamp.toLowerCase().includes(searchTermLower)) ||
                (log.registeredBy && log.registeredBy.toLowerCase().includes(searchTermLower))
            );
        });

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            setSearchTerm(inputValue);
        }
    };
    
    const handleDateSelect = (selectedDate: DateRange | undefined) => {
        setDate(selectedDate);
        if (selectedDate?.from && selectedDate?.to) {
            setIsCalendarOpen(false);
            setSearchTerm(inputValue); // Trigger search
        }
    }


    return (
        <div className="container mx-auto">
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Histórico de Acessos de Visitantes</CardTitle>
                    {!readOnly && (
                        <Link href="/dashboard">
                            <Button variant="outline">Voltar</Button>
                        </Link>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 py-4">
                        <Input
                            placeholder="Filtrar histórico..."
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="max-w-sm"
                        />
                         <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[300px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "dd/MM/yy", {locale: ptBR})} -{" "}
                                                {format(date.to, "dd/MM/yy", {locale: ptBR})}
                                            </>
                                        ) : (
                                            format(date.from, "dd/MM/yy", {locale: ptBR})
                                        )
                                    ) : (
                                        <span>Selecione um período</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={handleDateSelect}
                                    numberOfMonths={1}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Foto</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Responsável</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Entrada</TableHead>
                                    <TableHead>Saída</TableHead>
                                    <TableHead>Portaria do Acesso</TableHead>
                                    <TableHead>Presença</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center">
                                            Nenhum registro de acesso encontrado para o período selecionado.
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
                                            <TableCell>{log.company || '-'}</TableCell>
                                            <TableCell>{log.responsible || '-'}</TableCell>
                                            <TableCell>{log.reason || '-'}</TableCell>
                                            <TableCell>{log.entryTimestamp}</TableCell>
                                            <TableCell>{log.exitTimestamp || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{log.registeredBy}</Badge>
                                            </TableCell>
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
