

"use client";

import { useEffect, useState, KeyboardEvent } from 'react';
import { format, parseISO } from "date-fns";
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
import { Building, Home, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { getAccessLogsFromFirestore, getEmployeesFromFirestore } from '@/lib/firestoreService';

// Combine Log with Employee details
type EnrichedAccessLog = AccessLog & Partial<Omit<Employee, 'id' | 'name'>>;


export function EmployeeAccessLogTable({ readOnly = false }: { readOnly?: boolean }) {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from Firestore on initial render
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [logs, emps] = await Promise.all([
                    getAccessLogsFromFirestore(500), // Fetch more for history
                    getEmployeesFromFirestore()
                ]);
                setAccessLogs(logs.filter(log => log.personType === 'employee'));
                setEmployees(emps);
            } catch (error) {
                console.error("Error reading from Firestore", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
    }, []);
    
    const enrichedLogs: EnrichedAccessLog[] = accessLogs
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
            if (date?.from && date?.to) {
                const logDate = parseISO(log.entryTimestamp);
                const fromDate = new Date(date.from.setHours(0, 0, 0, 0));
                const toDate = new Date(date.to.setHours(23, 59, 59, 999));
                if (logDate < fromDate || logDate > toDate) {
                    return false;
                }
            }

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
            setSearchTerm(inputValue); // Trigger search
        }
    }

    return (
        <div className="container mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Histórico de Acessos de Funcionários</CardTitle>
                    {!readOnly && (
                        <Link href="/">
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
                                    <TableHead>Matrícula</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Setor</TableHead>
                                    <TableHead>Entrada</TableHead>
                                    <TableHead>Saída</TableHead>
                                    <TableHead>Portaria do Acesso</TableHead>
                                    <TableHead>Presença</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                     <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            Carregando histórico...
                                        </TableCell>
                                    </TableRow>
                                ) : enrichedLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            Nenhum registro de acesso encontrado para os filtros aplicados.
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
                                            <TableCell>{format(parseISO(log.entryTimestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                                            <TableCell>{log.exitTimestamp ? format(parseISO(log.exitTimestamp), 'dd/MM/yyyy HH:mm:ss') : '-'}</TableCell>
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
