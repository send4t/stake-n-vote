"use client";

import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { useState, useEffect } from "react";
import { BN_ZERO, bnToBn } from "@polkadot/util";
import {
  CHAIN_CONFIG,
  KUSAMA_DELEGATOR,
  POLKADOT_DELEGATOR,
} from "@/app/config";
import { findChangedItem, parseBN } from "@/app/util";
import useAccountBalances from "@/app/hooks/use-account-balance";
import { Switch } from "@nextui-org/switch";
import { useInkathon } from "@scio-labs/use-inkathon";

export function usePolkadotPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrice = async () => {
    setLoading(true);
    try {
      const response = await fetch('@/app/pages/api/get-polkadot-price'); // Fetch from the serverless function
      const data = await response.json();
      setPrice(data.price);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('Valami probléma lépett fel a Polkadot árfolyam lekérdezés közben'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
  }, []);

  return { price, loading, error, retry: fetchPrice };
}

export default function StakingRewardCalculator() {
  const { price, loading: priceLoading } = usePolkadotPrice();
  const { data: accountBalance } = useAccountBalances();
  const { activeChain } = useInkathon();
  const APY = 0.15; // 15% APY this should be coming from chain API

  const chainDetails = CHAIN_CONFIG[activeChain?.network || "Polkadot"];
  const tokenDecimals = chainDetails?.tokenDecimals || 12; // Defaulting to 12 if not specified

  const [stakeAmount, setStakeAmount] = useState<number>(0);
  const [isCompounding, setIsCompounding] = useState<boolean>(false);

  const calculateReward = (periodInDays: number): number => {
    const principal = stakeAmount;
    const rate = APY / 365; // daily rate
    const timesCompounded = isCompounding ? 6 * periodInDays : 1; // Compounded every 4 hours if enabled
    const period = periodInDays;

    return isCompounding
      ? principal * Math.pow(1 + rate / timesCompounded, timesCompounded * period) - principal
      : principal * rate * period;
  };

  const rewards = {
    daily: calculateReward(1),
    monthly: calculateReward(30),
    yearly: calculateReward(365),
  };

  const formatCurrency = (amount: number, currency: 'DOT' | 'USD'): string => {
    return currency === 'USD' && price
      ? `$${(amount * price).toFixed(2)}`
      : `${amount.toFixed(4)} DOT`;
  };


  return (
    <div className="flex flex-col text-white gap-4">
       <Button color="danger" onClick={() => accountBalance && setStakeAmount(parseBN(accountBalance.freeBalance, tokenDecimals))}>
         Összes elérhető DOT stake-elése
        </Button>
      <div className="flex gap-2">
        <Input
          label="Stake-be helyezett mennyiség (DOT)"
          type="number"
          placeholder="Írd be mennyit szeretnél stake-be helyezni"
          value={stakeAmount.toString()}
          onChange={(e) => setStakeAmount(Number(e.target.value))}
          fullWidth
        />
      </div>

      <Switch color="danger" checked={isCompounding} onChange={(e) => setIsCompounding(e.target.checked)}>
       Automatikus újra stake-elés (kamatos kamat 4 óránként újraszámolva)
      </Switch>

      <div className="flex flex-col gap-2 text-white">
        <div>Jutalmak 1 nap után: {formatCurrency(rewards.daily, 'DOT')} / {formatCurrency(rewards.daily, 'USD')}</div>
        <div>Jutalmak 1 hónap után: {formatCurrency(rewards.monthly, 'DOT')} / {formatCurrency(rewards.monthly, 'USD')}</div>
        <div>Jutalmak 1 év után: {formatCurrency(rewards.yearly, 'DOT')} / {formatCurrency(rewards.yearly, 'USD')}</div>
      </div>
    </div>
  );
}
