"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, UserCog, Users, UserCheck, Shield } from 'lucide-react';

const accessLevels = [
  { name: 'Portaria 1', icon: Building },
  { name: 'Portaria 2', icon: Building },
  { name: 'RH', icon: Users },
  { name: 'ADM', icon: UserCog },
  { name: 'Supervisor', icon: UserCheck },
];

export function Dashboard() {
  return (
    <div className="container mx-auto">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfis de Acesso</CardTitle>
            <CardDescription>Gerencie os perfis de acesso do sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accessLevels.map((level) => (
                <div key={level.name} className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center gap-4">
                    <level.icon className="h-6 w-6 text-primary" />
                    <span className="font-medium">{level.name}</span>
                  </div>
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
