import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, RefreshCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptchaChallengeProps {
  onSuccess: () => void;
  onCancel: () => void;
  attemptsRemaining: number;
}

type ChallengeType = 'math' | 'text' | 'pattern';

interface Challenge {
  type: ChallengeType;
  question: string;
  answer: string;
  hint?: string;
}

export function CaptchaChallenge({ onSuccess, onCancel, attemptsRemaining }: CaptchaChallengeProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const generateChallenge = useCallback((): Challenge => {
    const types: ChallengeType[] = ['math', 'text', 'pattern'];
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
      case 'math': {
        const operations = [
          () => {
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            return { question: `Quanto é ${a} + ${b}?`, answer: String(a + b) };
          },
          () => {
            const a = Math.floor(Math.random() * 10) + 5;
            const b = Math.floor(Math.random() * 5) + 1;
            return { question: `Quanto é ${a} - ${b}?`, answer: String(a - b) };
          },
          () => {
            const a = Math.floor(Math.random() * 5) + 2;
            const b = Math.floor(Math.random() * 5) + 2;
            return { question: `Quanto é ${a} × ${b}?`, answer: String(a * b) };
          },
        ];
        const op = operations[Math.floor(Math.random() * operations.length)]();
        return { type: 'math', ...op, hint: 'Digite apenas o número' };
      }

      case 'text': {
        const words = ['SEGURO', 'ACESSO', 'PORTAL', 'DIREÇÃO', 'AULA', 'CARRO', 'BRASIL'];
        const word = words[Math.floor(Math.random() * words.length)];
        const shuffled = word.split('').sort(() => Math.random() - 0.5).join('');
        return {
          type: 'text',
          question: `Reorganize as letras: ${shuffled}`,
          answer: word,
          hint: 'Palavra em maiúsculas',
        };
      }

      case 'pattern': {
        const patterns = [
          { sequence: '2, 4, 6, 8, ?', answer: '10' },
          { sequence: '1, 3, 5, 7, ?', answer: '9' },
          { sequence: '3, 6, 9, 12, ?', answer: '15' },
          { sequence: '5, 10, 15, 20, ?', answer: '25' },
          { sequence: '1, 4, 9, 16, ?', answer: '25' },
        ];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        return {
          type: 'pattern',
          question: `Complete a sequência: ${pattern.sequence}`,
          answer: pattern.answer,
          hint: 'Digite o próximo número',
        };
      }

      default:
        return generateChallenge();
    }
  }, []);

  useEffect(() => {
    setChallenge(generateChallenge());
  }, [generateChallenge]);

  const handleRefresh = () => {
    setChallenge(generateChallenge());
    setUserAnswer('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedAnswer = userAnswer.trim().toUpperCase();
    const normalizedCorrect = challenge?.answer.toUpperCase();

    if (normalizedAnswer === normalizedCorrect) {
      onSuccess();
    } else {
      setAttempts(prev => prev + 1);
      if (attempts >= 2) {
        setError('Muitas tentativas incorretas. Gerando novo desafio...');
        setTimeout(() => {
          handleRefresh();
          setAttempts(0);
        }, 1500);
      } else {
        setError('Resposta incorreta. Tente novamente.');
      }
    }
    
    setIsVerifying(false);
  };

  const getChallengeIcon = () => {
    switch (challenge?.type) {
      case 'math': return '🔢';
      case 'text': return '🔤';
      case 'pattern': return '🔗';
      default: return '❓';
    }
  };

  if (!challenge) return null;

  return (
    <Card className="w-full max-w-md mx-auto border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-amber-600" />
          <Badge variant="outline" className="border-amber-500 text-amber-700">
            Verificação de Segurança
          </Badge>
        </div>
        <CardTitle className="text-lg">
          Prove que você é humano
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Por segurança, resolva o desafio abaixo
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Challenge Display */}
        <div className="bg-background rounded-lg p-4 border text-center">
          <div className="text-3xl mb-2">{getChallengeIcon()}</div>
          <p className="font-medium text-lg">{challenge.question}</p>
          {challenge.hint && (
            <p className="text-xs text-muted-foreground mt-2">{challenge.hint}</p>
          )}
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Sua resposta..."
              className={cn(
                "flex-1 text-center text-lg font-mono",
                error && "border-destructive"
              )}
              autoFocus
              disabled={isVerifying}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isVerifying}
              title="Novo desafio"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isVerifying}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!userAnswer.trim() || isVerifying}
            >
              {isVerifying ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        </form>

        {/* Attempts Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Tentativas de login restantes: <span className="font-bold text-amber-600">{attemptsRemaining}</span></p>
          {attempts > 0 && (
            <p className="text-amber-600 mt-1">
              Tentativas do CAPTCHA: {attempts}/3
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
