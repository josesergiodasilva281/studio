"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Mock authentication logic
    if ((role === 'rh' && password === 'rh123') ||
        (role === 'portaria1' && password === 'portaria123') ||
        (role === 'portaria2' && password === 'portaria123') ||
        (role === 'supervisor' && password === 'supervisor123')) {
      // Pass role as a query parameter to the dashboard
      router.push(`/dashboard?role=${role}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: 'Usuário ou senha inválidos.',
      });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
            <KeyRound className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Videira</CardTitle>
        <CardDescription>
          Selecione seu perfil e insira sua senha para acessar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="role">Perfil</Label>
            <Select onValueChange={setRole} value={role}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rh">RH</SelectItem>
                <SelectItem value="portaria1">Portaria 1</SelectItem>
                <SelectItem value="portaria2">Portaria 2</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          </div>
          <Button onClick={handleLogin} className="w-full">
            Entrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
