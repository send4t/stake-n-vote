"use client";

import { Button, ButtonGroup } from "@nextui-org/button";

import { useDisclosure } from "@nextui-org/modal";
import ModalDelegate from "./modal-delegate";
import ModalStake from "./modal-stake";
import ModalCalc from "./modal-calculator"
import { event } from "nextjs-google-analytics";
import { useInkathon } from "@scio-labs/use-inkathon";
import { useApp } from "@/app/providers/app-provider";

export function DelegateStakeButtons() {
  const { enableEffect } = useApp();
  const openExtensionModal = () => {
    enableEffect();
  };

  const { isOpen: isCalcOpen, onOpenChange: onCalcOpenChange } =
  useDisclosure();
  const { isOpen: isStakingOpen, onOpenChange: onStakingOpenChange } =
    useDisclosure();
  const { isOpen: isDelegatingOpen, onOpenChange: onDelegatingOpenChange } =
    useDisclosure();
  const { activeChain, isConnecting, activeAccount } = useInkathon();

  const handleStakingOpen = () => {
    event("staking_open", {
      category: "Modal",
      label: "staking modal opened",
    });
    activeAccount ? onStakingOpenChange() : openExtensionModal();
  };

  const handleDelegatingOpen = () => {
    event("delegating_open", {
      category: "Modal",
      label: "delegating modal opened",
    });
    activeAccount ? onDelegatingOpenChange() : openExtensionModal();
  };

  const handleCalcOpen = () => {
    event("calc_open", {
      category: "Modal",
      label: "calc modal opened",
    });
    onCalcOpenChange(); // Always open the calculation modal
  };

  return (
    <div className="max-w-xl grid gap-4 md:grid-cols-2 items-center justify-center my-10">
      <Button
        variant="bordered"
        className={
          "border-2 border-white text-white w-full shadow-xl text-base py-6 rounded-xl hover:bg-white/10"
        }
        size="sm"
        onClick={handleStakingOpen}
        isLoading={isConnecting}
      >
        {/* @ts-ignore */}
        {activeChain?.tokenSymbol} Stake-elés
      </Button>
      <Button
        variant="bordered"
        className="border-2 border-white text-white w-full shadow-xl text-base py-6 rounded-xl hover:bg-white/10"
        size="sm"
        onClick={handleDelegatingOpen}
        isLoading={isConnecting}
      >
        {/* @ts-ignore */}
        {activeChain?.tokenSymbol} Szavazat delegálás
      </Button>
      <Button
        variant="bordered"
        className={
          "border-2 border-white text-white w-full shadow-xl text-base py-6 rounded-xl hover:bg-white/10"
        }
        size="sm"
        onClick={handleCalcOpen}
        isLoading={isConnecting}
      >
        {/* @ts-ignore */}
        {activeChain?.tokenSymbol} Staking Kalkulátor
      </Button>
      {isCalcOpen && (
        <ModalCalc
          isOpen={isCalcOpen}
          onOpenChange={onCalcOpenChange}
        />
      )}
      {isDelegatingOpen && (
        <ModalDelegate
          isOpen={isDelegatingOpen}
          onOpenChange={onDelegatingOpenChange}
        />
      )}
      {isStakingOpen && (
        <ModalStake
          isOpen={isStakingOpen}
          onOpenChange={onStakingOpenChange}
          onDelegatingOpenChange={onDelegatingOpenChange}
        />
      )}
    </div>
  );
}
