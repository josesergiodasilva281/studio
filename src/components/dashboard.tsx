"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Bot, Clock, QrCode, ScanLine, ShieldCheck, ShieldX, User, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { performLogAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { LogEntry } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

const VALID_CODES = ['USER-123-VALID', 'VISITOR-456-OK', 'ADMIN-789-MASTER'];

export function Dashboard() {
  const [userInput, setUserInput] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
  const [accessLogs, setAccessLogs] = useState<LogEntry[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGenerateQr = () => {
    if (!userInput.trim()) {
      toast({
        title: 'Entrada inválida',
        description: 'Por favor, insira um nome ou ID para gerar o código.',
        variant: 'destructive',
      });
      return;
    }
    setQrValue(userInput);
    setUserInput('');
  };

  const handleScan = () => {
    const possibleScanResults = [...VALID_CODES, 'INVALID-CODE-1', 'INVALID-CODE-2', 'USER-123-EXPIRED'];
    const scannedCode = possibleScanResults[Math.floor(Math.random() * possibleScanResults.length)];
    const isValid = VALID_CODES.includes(scannedCode);
    const newLog: LogEntry = {
      timestamp: new Date(),
      user: scannedCode,
      status: isValid ? 'granted' : 'denied',
    };
    
    setAccessLogs(prevLogs => [newLog, ...prevLogs]);

    if (!isValid) {
        toast({
            title: 'Acesso Negado',
            description: `O código "${scannedCode}" é inválido ou expirou.`,
            variant: 'destructive',
        });
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult('');
    const result = await performLogAnalysis(accessLogs);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };
  
  return (
    <div className="container mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode className="text-primary"/>Gerador de Código</CardTitle>
          <CardDescription>Insira um ID para gerar um QR Code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col flex-1">
          <div className="flex gap-2">
            <Input 
              placeholder="Ex: Visitante01" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateQr()}
            />
            <Button onClick={handleGenerateQr} className="bg-primary hover:bg-primary/90">Gerar</Button>
          </div>
          {qrValue && (
            <div className="p-4 bg-white rounded-lg border flex flex-col items-center gap-2 transition-all duration-300 ease-in-out transform animate-in fade-in zoom-in-95 mt-auto">
              <Image 
                src={`https://placehold.co/200x200.png`}
                alt={`QR Code para ${qrValue}`}
                width={200}
                height={200}
                data-ai-hint="qr code"
                className="rounded-md"
              />
              <p className="font-semibold text-center">{qrValue}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock />Registro de Acesso</CardTitle>
          <CardDescription>Simule leituras e veja os eventos de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleScan} variant="outline" className="mb-4 w-full md:w-auto border-accent text-accent hover:bg-accent/10 hover:text-accent">
            <ScanLine className="mr-2" /> Simular Leitura de Código
          </Button>
          <ScrollArea className="h-72 w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead><User className="inline-block h-4 w-4" /> Usuário/ID</TableHead>
                  <TableHead className="text-right"><Clock className="inline-block h-4 w-4" /> Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessLogs.length > 0 ? (
                  accessLogs.map((log) => (
                    <TableRow key={log.timestamp.toISOString()}>
                      <TableCell>
                        {log.status === 'granted' ? (
                          <Badge variant="default"><ShieldCheck className="h-4 w-4 mr-1" />Permitido</Badge>
                        ) : (
                          <Badge variant="destructive"><ShieldX className="h-4 w-4 mr-1" />Negado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium font-code">{log.user}</TableCell>
                      <TableCell className="text-right">{log.timestamp.toLocaleTimeString('pt-BR')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                      Nenhum registro de acesso ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/>Análise de Segurança com IA</CardTitle>
          <CardDescription>Use IA para detectar padrões de acesso suspeitos nos registros.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || accessLogs.length === 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Wand2 className="mr-2" /> {isAnalyzing ? 'Analisando...' : 'Analisar Logs'}
          </Button>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg min-h-[100px] border">
            <h4 className="font-semibold mb-2">Resultados da Análise:</h4>
            {isAnalyzing ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {analysisResult || 'Nenhuma análise realizada ainda. Clique no botão acima para começar.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
