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
import { BN, BN_ZERO, bnToBn } from "@polkadot/util";
import { SubstrateChain, useInkathon } from "@scio-labs/use-inkathon";
import { NotConnected } from "./not-connected";
import { trimAddress } from "@/app/util";
import Link from "next/link";
import styles from "./modal.module.scss";

type ModalPropType = Omit<ModalProps, "children"> & {
  onDelegatingOpenChange: () => void;
};

export default function ModalStake(props: ModalPropType) {
  const { isOpen, onOpenChange, onDelegatingOpenChange } = props;
  const { activeChain, activeAccount } = useInkathon();

  const {
    data: stakingInfo = { nominators: [], pool: null }, // Add a default value to ensure stakingInfo is never undefined
    isLoading: isStakingInfoLoading,
    isFetching: isStakingInfoFetching,
  } = useAccountMyStakes();

  const {
    data: accountBalance,
    isLoading: isAccountBalanceLoading,
    isFetching: isAccountBalanceFetching,
  } = useAccountBalances();

  const { tokenSymbol, tokenDecimals } =
    CHAIN_CONFIG[activeChain?.network || "Polkadot"] || {};

  const { freeBalance } = accountBalance || { freeBalance: BN_ZERO };
  const humanFreeBalance = parseBN(freeBalance, tokenDecimals);

  const [stakeAmount, setStakeAmount] = useState<number | undefined>();
  const stakeBalance =
    stakeAmount && !isNaN(stakeAmount) && stakeAmount !== 0
      ? bnToBn(stakeAmount * Math.pow(10, tokenDecimals))
      : BN_ZERO;

  const isLoading =
    isStakingInfoLoading ||
    isAccountBalanceLoading ||
    isStakingInfoFetching ||
    isAccountBalanceFetching;

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
            <ModalHeader className="flex flex-col gap-1">
              {activeAccount ? (
                <>
                  Jelenleg itt van aktív {tokenSymbol}  stake-ed {" "}
                  <span className="text-xs text-gray-300">
                    ({humanFreeBalance.toFixed(2)} {tokenSymbol} elérhető)
                  </span>
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
              ) : stakingInfo.nominators.length === 0 &&
                !stakingInfo.pool ? (
                <p>Semmilyen validátornál nincs jelenleg Stake-ed</p>
              ) : (
                <div>
                  {stakingInfo.nominators.length > 0 && (
                    <>
                      <h3>Önálló stake:</h3>
                      <ul>
                        {stakingInfo.nominators.map((address) => (
                          <li key={address}>
                            <p>Cím: {trimAddress(address, 8)}</p>
                            <Link
                              href={`//${activeChain?.network}.subscan.io/account/${address}`}
                              target="_blank"
                              className="underline text-xs text-default-500"
                            >
                              👀 subscan ↗️
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {stakingInfo.pool && (
                    <>
                      <h3>Neked Pool-ban van DOT tokened</h3>
                      <p>Egészen pontosan a {stakingInfo.pool} számú pool-ban</p>
                      <Link
                        href={`https://staking.polkadot.network`}
                        target="_blank"
                        className="underline text-xs text-default-500"
                      >
                        Ha szeretnéd módosítani a hivatalos stake oldalt javasoljuk
                      </Link>
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
