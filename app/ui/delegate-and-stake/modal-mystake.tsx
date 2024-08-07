import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalProps,
} from "@nextui-org/modal";
import { Skeleton } from "@nextui-org/skeleton";
import { useAccountMyStakes } from "@/app/hooks/use-account-mystake";
import { CHAIN_CONFIG } from "@/app/config";
import useAccountBalances from "@/app/hooks/use-account-balance";
import { useState } from "react";
import { BN, BN_ZERO } from "@polkadot/util";
import { SubstrateChain, useInkathon } from "@scio-labs/use-inkathon";
import { NotConnected } from "./not-connected";
import { trimAddress } from "@/app/util";
import Link from "next/link";
import styles from "./modal.module.scss";
import { useAddStake } from "@/app/hooks/use-addStake";

type ModalPropType = Omit<ModalProps, "children"> & {
  onDelegatingOpenChange: () => void;
};

export default function ModalStake(props: ModalPropType) {
  const { isOpen, onOpenChange, onDelegatingOpenChange } = props;
  const { activeChain, activeAccount } = useInkathon();
  const { data: stakingInfo = { nominators: [], pool: null, stakedAmount: BN_ZERO }, isLoading: isStakingInfoLoading, isFetching: isStakingInfoFetching } = useAccountMyStakes();
  const { data: accountBalance, isLoading: isAccountBalanceLoading, isFetching: isAccountBalanceFetching } = useAccountBalances();
  const { tokenSymbol, tokenDecimals } = CHAIN_CONFIG[activeChain?.network || "Polkadot"] || {};
  const { freeBalance } = accountBalance || { freeBalance: BN_ZERO };
  const humanFreeBalance = parseBN(freeBalance, tokenDecimals);

  const [additionalStake, setAdditionalStake] = useState("");
  const { mutate: addStake, isLoading: isAddingStake } = useAddStake();

  const isLoading = isStakingInfoLoading || isAccountBalanceLoading || isStakingInfoFetching || isAccountBalanceFetching;

  const humanStakedAmount = parseBN(stakingInfo.stakedAmount, tokenDecimals);

  const handleAddStake = () => {
    const amount = new BN(additionalStake).mul(new BN(Math.pow(10, tokenDecimals)));
    addStake(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className={styles.modal}
      size="2xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
      <ModalContent className={styles.modal}>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col text-white gap-1">
              {activeAccount ? (
                <>
                  <span className="text-xs text-gray-300">
                    (tárcádban szabadon elérhető: {humanFreeBalance.toFixed(2)} {tokenSymbol} token)
                  </span>
                  Jelenleg itt van aktív {tokenSymbol} stake-ed{" "}:
                </>
              ) : (
                "Nem találom az account-ot"
              )}
            </ModalHeader>
            <ModalBody className="text-sm mb-4">
              {activeAccount === undefined ? (
                <NotConnected />
              ) : isLoading ? (
                <>
                  <Skeleton className="rounded-lg">
                    <Button></Button>
                  </Skeleton>
                  <Skeleton className="rounded-lg">
                    <Button></Button>
                  </Skeleton>
                </>
              ) : stakingInfo.nominators.length === 0 && !stakingInfo.pool ? (
                <p>Semmilyen validátornál nincs jelenleg Stake-ed</p>
              ) : (
                <div>
                  {stakingInfo.nominators.length > 0 && (
                    <>
                      <p>Jelenleg Polkadoton {humanStakedAmount.toFixed(2)} {tokenSymbol}-ot stakelsz natívan. Ha unstakelni szeretnéd a DOT-jaid, akkor látogass el a <Link
                        href={`https://staking.polkadot.cloud`}
                        target="_blank"
                        className="underline text-s"
                      >
                        Polkadot Staking Dashboard
                      </Link> oldalára.</p>
                    </>
                  )}
                  {stakingInfo.pool && (
                    <>
                      <p>A &quot;{stakingInfo.pool}&quot; számú Nomination Pool-ban stakelsz jelenleg {humanStakedAmount.toFixed(2)} {tokenSymbol}-ot. Ha unstakelni szeretnéd a Pool-ból a DOT-jaid, akkor látogass el a <Link
                        href={`https://staking.polkadot.cloud`}
                        target="_blank"
                        className="underline text-s"
                      >
                        Polkadot Staking Dashboard
                      </Link> oldalára.</p>
                      <div className="flex flex-col text-white gap-4 mt-4">
                        <input
                          type="number"
                          value={additionalStake}
                          onChange={(e) => setAdditionalStake(e.target.value)}
                          placeholder="Adj hozzá több DOT-ot"
                          className="p-2 rounded border w-full"
                        />
                        <Button
                          color="danger"
                          onClick={handleAddStake}
                          disabled={isAddingStake || !additionalStake}
                        >
                          {isAddingStake ? "Folyamatban.." : "DOT hozzáadás"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function parseBN(value: any, decimals: number): number {
  if (!value) return 0;
  return parseFloat((value / Math.pow(10, decimals)).toFixed(decimals));
}
