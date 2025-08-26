

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
import type { AccessLog, Employee } from '@/lib/types';
import { Input } from './ui/input';
import { LogIn, LogOut, Building, Home, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

// Combine Log with Employee details
type EnrichedAccessLog = AccessLog & Partial<Omit<Employee, 'id' | 'name'>>;

// Helper function to parse pt-BR date strings
const parsePtBrDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    // Format: "26/07/2024, 15:30:00" -> "2024-07-26T15:30:00"
    const parts = dateString.split(', ');
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return null;
    // year, month (0-indexed), day
    return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1]}`);
};

export function EmployeeAccessLogTable() {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
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
            // Date filtering
            const logDate = parsePtBrDate(log.entryTimestamp);
            if (!logDate) return false;
            
            const fromDate = date?.from ? new Date(date.from.setHours(0, 0, 0, 0)) : null;
            const toDate = date?.to ? new Date(date.to.setHours(23, 59, 59, 999)) : null;

            if (fromDate && logDate < fromDate) return false;
            if (toDate && logDate > toDate) return false;

            // Search term filtering
            if (!searchTerm) return true;
            const searchTermLower = searchTerm.toLowerCase();

            return (
                log.personName.toLowerCase().includes(searchTermLower) ||
                log.personId.toLowerCase().includes(searchTermLower) ||
                (log.department && log.department.toLowerCase().includes(searchTermLower)) ||
                (log.plate && log.plate.toLowerCase().includes(searchTermLower)) ||
                (log.ramal && log.ramal.toLowerCase().includes(searchTermLower)) ||
                log.entryTimestamp.toLowerCase().includes(searchTermLower) ||
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
        }
    }

    return (
        <div className="container mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>HISTÓRICO</CardTitle>
                     <Link href="/">
                        <Button variant="outline">Voltar</Button>
                    </Link>
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
                                    <TableHead>Matrícula</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Setor</TableHead>
                                    <TableHead>Entrada</TableHead>
                                    <TableHead>Saída</TableHead>
                                    <TableHead>Portaria</TableHead>
                                    <TableHead>Presença</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrichedLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            Nenhum registro de acesso encontrado para o período selecionado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    enrichedLogs.map((log) => {
                                        const presence = log.exitTimestamp === null ? 'Dentro' : 'Fora';
                                        return (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.personId}</TableCell>
                                            <TableCell>{log.personName}</TableCell>
                                            <TableCell>{log.department || '-'}</TableCell>
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


