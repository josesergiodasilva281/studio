"use client";

import { useState } from 'react';
import Image from 'next/image';
import { QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function Dashboard() {
  const [userInput, setUserInput] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
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

  return (
    <div className="container mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-3 flex flex-col">
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
    </div>
  );
}
