
"use client";

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DashboardProps {
  role: string | null;
}

export function Dashboard({ role }: DashboardProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string>('');

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Erro de Câmera',
          description: 'Seu navegador não suporta o acesso à câmera.',
        });
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acesso à Câmera Negado',
          description: 'Por favor, habilite a permissão de câmera nas configurações do seu navegador.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  const getRoleName = (role: string | null) => {
    switch (role) {
      case 'rh':
        return 'Recursos Humanos';
      case 'portaria1':
        return 'Portaria 1';
      case 'portaria2':
        return 'Portaria 2';
      case 'supervisor':
        return 'Supervisor';
      default:
        return 'Usuário';
    }
  }

  return (
    <div className="container mx-auto">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Painel de Controle - {getRoleName(role)}</CardTitle>
          </CardHeader>
          <CardContent>
             {/* Futuramente, aqui podemos adicionar componentes específicos para cada perfil */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leitor de QR Code e Código de Barras</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            </div>
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                <AlertDescription>
                  Por favor, permita o acesso à câmera para utilizar esta funcionalidade.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="code">Código Lido</Label>
              <Input type="text" id="code" placeholder="Aguardando leitura..." value={scannedData} readOnly />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
