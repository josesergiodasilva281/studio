

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
import type { CarLog } from '@/lib/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Link from 'next/link';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { getCarLogsFromFirestore } from '@/lib/firestoreService';


export function CarAccessLogTable({ readOnly = false }: { readOnly?: boolean }) {
    const [carLogs, setCarLogs] = useState<CarLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const storedLogs = await getCarLogsFromFirestore(500);
                setCarLogs(storedLogs);
            } catch (error) {
                console.error("Error reading from Firestore", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
    }, []);
    
    const filteredLogs = carLogs.filter(log => {
        // Date filtering
        if (date?.from && date?.to) {
            const logDate = parseISO(log.startTime);
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
            (log.carId && log.carId.toLowerCase().includes(searchTermLower)) ||
            (log.carFleet && log.carFleet.toLowerCase().includes(searchTermLower)) ||
            (log.driverName && log.driverName.toLowerCase().includes(searchTermLower)) ||
            (log.returnDriverName && log.returnDriverName.toLowerCase().includes(searchTermLower)) ||
            (log.startKm && log.startKm.toString().toLowerCase().includes(searchTermLower)) ||
            (log.endKm && log.endKm.toString().toLowerCase().includes(searchTermLower)) ||
            (log.startRegisteredBy && log.startRegisteredBy.toLowerCase().includes(searchTermLower)) ||
            (log.endRegisteredBy && log.endRegisteredBy.toLowerCase().includes(searchTermLower))
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
                    <CardTitle>Histórico de Uso dos Carros</CardTitle>
                    {!readOnly && (
                        <Link href="/cars">
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
                                    <TableHead>Frota</TableHead>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Motorista Saída</TableHead>
                                    <TableHead>KM Saída</TableHead>
                                    <TableHead>Saída</TableHead>
                                    <TableHead>Portaria Saída</TableHead>
                                    <TableHead>Retorno</TableHead>
                                    <TableHead>Quem Retornou</TableHead>
                                    <TableHead>KM Retorno</TableHead>
                                    <TableHead>Portaria Retorno</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center">
                                            Carregando histórico...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.carFleet}</TableCell>
                                            <TableCell className="font-medium">{log.carId}</TableCell>
                                            <TableCell>{log.driverName}</TableCell>
                                            <TableCell>{log.startKm || '-'}</TableCell>
                                            <TableCell>{format(parseISO(log.startTime), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{log.startRegisteredBy || '-'}</Badge>
                                            </TableCell>
                                            <TableCell>{log.endTime ? format(parseISO(log.endTime), 'dd/MM/yyyy HH:mm:ss') : 'Em uso'}</TableCell>
                                            <TableCell>{log.returnDriverName || '-'}</TableCell>
                                            <TableCell>{log.endKm || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{log.endRegisteredBy || '-'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={log.endTime ? 'default' : 'destructive'}>
                                                    {log.endTime ? 'Finalizado' : 'Em uso'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center">
                                            Nenhum registro encontrado para os filtros aplicados.
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
