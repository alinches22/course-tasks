'use client';

import { useState } from 'react';
import { useMutation } from 'urql';
import { useRouter } from 'next/navigation';
import { CREATE_BATTLE } from '@/lib/graphql/operations/battles';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ROUTES } from '@/lib/constants/routes';

interface CreateBattleFormProps {
  onSuccess?: () => void;
}

export function CreateBattleForm({ onSuccess }: CreateBattleFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [startingBalance, setStartingBalance] = useState('10000');
  const [, createBattle] = useMutation(CREATE_BATTLE);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const result = await createBattle({
        input: { startingBalance: parseFloat(startingBalance) },
      });

      if (result.error) throw new Error(result.error.message);

      addToast('success', 'Battle created! Waiting for opponent...');
      onSuccess?.();

      // Redirect to battle page
      if (result.data?.createBattle?.id) {
        router.push(ROUTES.BATTLE(result.data.createBattle.id));
      }
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to create battle');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Battle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Starting Balance"
            type="number"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            min={100}
            max={1000000}
            step={100}
            leftIcon={
              <span className="text-text-muted">$</span>
            }
          />

          <p className="text-sm text-text-secondary">
            Both players start with the same virtual balance. A random historical scenario will be selected.
          </p>

          <Button type="submit" className="w-full" isLoading={isCreating}>
            Create Battle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
