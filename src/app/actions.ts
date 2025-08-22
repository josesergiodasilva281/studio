'use server';

import { analyzeAccessPatterns } from '@/ai/flows/analyze-access-patterns';
import type { LogEntry } from '@/lib/types';

export async function performLogAnalysis(
  logs: LogEntry[]
): Promise<string> {
  if (!logs || logs.length === 0) {
    return 'Não há logs para analisar.';
  }

  const logString = logs
    .map(
      (log) =>
        `${log.timestamp.toISOString()} - Usuário: ${log.user} - Acesso ${
          log.status === 'granted' ? 'Permitido' : 'Negado'
        }`
    )
    .join('\n');

  try {
    const result = await analyzeAccessPatterns({
      accessLogs: logString,
      normalHoursStart: '09:00',
      normalHoursEnd: '18:00',
    });
    return result.anomalies;
  } catch (error) {
    console.error('Erro ao analisar logs:', error);
    return 'Ocorreu um erro ao tentar analisar os padrões de acesso. Por favor, tente novamente.';
  }
}
