import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalProps,
} from "@nextui-org/modal";
import { RadioGroup, Radio } from "@nextui-org/radio";
import { Skeleton } from "@nextui-org/skeleton";

import styles from "./modal.module.scss";
import { useAccountNominators } from "@/app/hooks/use-account-nominations";
import { CHAIN_CONFIG } from "@/app/config";
import useAccountBalances from "@/app/hooks/use-account-balance";
import { Dispatch, SetStateAction, useState } from "react";
import { bondAndNominateTx, joinPool, nominateTx } from "@/app/txs/txs";
import { ApiPromise } from "@polkadot/api";
import { useStakingMetrics } from "@/app/hooks/use-min-nominator-bond";
import {
  BN,
  BN_MAX_INTEGER,
  BN_ONE,
  BN_ZERO,
  bnToBn,
  formatBalance,
} from "@polkadot/util";
import { Input } from "@nextui-org/input";
import { KusamaIcon, PolkadotIcon } from "../icons";
import { parseBN, trimAddress } from "@/app/util";
import Link from "next/link";
import { Tooltip } from "@nextui-org/tooltip";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { NotConnected } from "./not-connected";
import { SubstrateChain, useInkathon } from "@scio-labs/use-inkathon";
import { kusamaRelay, polkadotRelay } from "@/app/lib/chains";
import { InjectedAccount } from "@polkadot/extension-inject/types";
import { Signer } from "@polkadot/types/types";

type ModalPropType = Omit<ModalProps, "children"> & {
  onDelegatingOpenChange: () => void;
};

export default function ModalStake(props: ModalPropType) {
  const router = useRouter();
  const { isOpen, onOpenChange, onDelegatingOpenChange } = props;

  const { activeChain, activeAccount, api, activeSigner } = useInkathon();

  const {
    data: nominators,
    isLoading: isNominatorsLoading,
    isFetching: isNominatorsFetching,
  } = useAccountNominators();
  const {
    data: accountBalance,
    isLoading: isAccountBalanceLoading,
    isFetching: isAccountBalanceFetching,
  } = useAccountBalances();

  const {
    data: stakingMetrics,
    isLoading: isStakingMetricsLoading,
    isFetching: isStakingMetricsFetching,
  } = useStakingMetrics();

  const { minNominatorBond, minimumActiveStake } = stakingMetrics || {
    minNominatorBond: "0",
    minimumActiveStake: "0",
  };

  const {
    maxNominators,
    validator: kusValidator,
    tokenSymbol,
    tokenDecimals,
  } = CHAIN_CONFIG[activeChain?.network || "Polkadot"] || {};

  const { freeBalance } = accountBalance || { freeBalance: BN_ZERO };
  const humanFreeBalance = parseBN(freeBalance, tokenDecimals);

  const [stakeAmount, setStakeAmount] = useState<number | undefined>();
  const stakeBalance =
    stakeAmount && !isNaN(stakeAmount) && stakeAmount !== 0
      ? bnToBn(stakeAmount * Math.pow(10, tokenDecimals))
      : BN_ZERO;

  const polkadotMinNominatorBond = bnToBn(minimumActiveStake).addn(
    tokenDecimals * 100
  );

  const amountSmallerThanMinNominatorBond =
    activeChain === kusamaRelay
      ? stakeBalance.lt(bnToBn(minimumActiveStake))
      : stakeBalance.lt(polkadotMinNominatorBond);

  const showSupported = !freeBalance.eq(BN_ZERO);

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
                  Stake-elj {tokenSymbol} -ot a Polkadot Hungary-vel{" "}
                  <span className="text-xs text-gray-300">
                    ({humanFreeBalance.toFixed(2)} {tokenSymbol} elérhető)
                  </span>
                </>
              ) : (
                "No account found"
              )}
            </ModalHeader>
            <ModalBody className="text-sm mb-4">
              {activeAccount === undefined ? (
                <NotConnected />
              ) : isAccountBalanceLoading ||
                isNominatorsLoading ||
                isStakingMetricsLoading ||
                isAccountBalanceFetching ||
                isNominatorsFetching ||
                isStakingMetricsFetching ? (
                <>
                  <Skeleton className="rounded-lg">
                    <Button></Button>
                  </Skeleton>
                  <Skeleton className="rounded-lg">
                    <Button></Button>
                  </Skeleton>
                </>
              ) : nominators?.length === 0 ? (
                <>
                  {freeBalance.toString() === "0" ||
                  freeBalance.toString() === "00" ||
                  (activeChain === kusamaRelay &&
                    freeBalance.lt(bnToBn(minNominatorBond))) ? (
                    <NoFunds
                      tokenSymbol={tokenSymbol}
                      accountBalance={accountBalance}
                    />
                  ) : (
                    <MaybeAddToPool
                      tokenSymbol={tokenSymbol}
                      tokenDecimals={tokenDecimals}
                      api={api}
                      signer={activeSigner}
                      activeChain={activeChain}
                      accountBalance={accountBalance}
                      activeAccount={activeAccount}
                      minNominatorBond={minNominatorBond}
                      minimumActiveStake={minimumActiveStake}
                      stakeBalance={stakeBalance}
                      stakeAmount={stakeAmount}
                      setStakeAmount={setStakeAmount}
                      amountSmallerThanMinNominatorBond={
                        amountSmallerThanMinNominatorBond
                      }
                    />
                  )}
                </>
              ) : nominators?.includes(kusValidator) ? (
                <Success
                  onClose={onClose}
                  onDelegationOpenChange={onDelegatingOpenChange}
                />
              ) : nominators?.length && nominators.length < maxNominators ? (
                <AddKusToSet
                  nominators={nominators}
                  validator={kusValidator}
                  api={api}
                  signer={activeSigner}
                  activeAccount={activeAccount}
                  tokenSymbol={tokenSymbol}
                />
              ) : nominators?.length === maxNominators ? (
                <ReplaceOneWithKus
                  nominators={nominators}
                  validator={kusValidator}
                  api={api}
                  signer={activeSigner}
                  activeAccount={activeAccount}
                  activeChain={activeChain}
                />
              ) : (
                <>
                  <p>
                    Valami nem sikerült{" "}
                    <a
                      className="text-danger cursor-pointer"
                      onClick={() => router.refresh()}
                    >
                      Próbáld újra
                    </a>
                    .
                  </p>
                </>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function Success({
  onClose,
  onDelegationOpenChange,
}: {
  onClose: () => void;
  onDelegationOpenChange: () => void;
}) {
  function goDelegate() {
    onClose();
    onDelegationOpenChange();
  }

  return (
    <>
      <p>Úgy látszik már &apos; a Polkadot Hungary-vel stake-elsz</p>
      <Button color="danger" onClick={goDelegate}>
        Szavazati erő delegálása
      </Button>
    </>
  );
}

function NoFunds({
  tokenSymbol,
  accountBalance,
}: {
  tokenSymbol: string;
  accountBalance: any;
}) {
  return (
    <>
      <p>
        Küldj {tokenSymbol}-ot a tárcádba vagy vegyél {tokenSymbol}-ot
      </p>
      <div className="flex gap-2 items-center">
        <a href="https://global.transak.com/">
          <Image
            src="transak.svg"
            alt="transak fiat onramp"
            width={120}
            height={50}
          />
        </a>{" "}
        vagy
        <a href="https://banxa.com/">
          <Image
            src="banxa.svg"
            alt="banxa fiat onramp"
            width={120}
            height={50}
          />
        </a>
      </div>
    </>
  );
}

function MaybeAddToPool({
  api,
  signer,
  tokenSymbol,
  tokenDecimals,
  activeChain,
  accountBalance,
  activeAccount,
  minNominatorBond,
  minimumActiveStake,
  stakeAmount,
  setStakeAmount,
  stakeBalance,
  amountSmallerThanMinNominatorBond,
}: {
  api: ApiPromise | undefined;
  signer: Signer | undefined;
  activeChain: SubstrateChain | undefined;
  tokenSymbol: string;
  tokenDecimals: number;
  accountBalance: any;
  activeAccount: InjectedAccount | null;
  minNominatorBond: any;
  minimumActiveStake: any;
  stakeAmount: number | undefined;
  setStakeAmount: Dispatch<SetStateAction<number | undefined>>;
  stakeBalance: BN;
  amountSmallerThanMinNominatorBond: boolean;
}) {
  const joinNominationPool = async () => {
    const poolToJoin = CHAIN_CONFIG[activeChain?.network || "Polkadot"].poolId;

    if (!poolToJoin) {
      throw new Error("No pool to join");
    }

    const tx = await joinPool(
      api,
      signer,
      activeAccount?.address,
      stakeBalance,
      poolToJoin
    );
  };

  const bondAndNominate = async () => {
    const targets =
      CHAIN_CONFIG[activeChain?.network || "Polkadot"].validator_set;

    const amount = bnToBn(stakeAmount);

    const tx = await bondAndNominateTx(
      api,
      signer,
      activeAccount?.address,
      targets,
      amount
    );
  };

  const stakeMax = () => {
    const a =
      parseBN(accountBalance.freeBalance?.toString(), tokenDecimals) - 0.2;
    setStakeAmount(a);
  };

  const humanReadableMinNominatorBond = parseBN(
    minNominatorBond,
    tokenDecimals
  );

  const isDisabled =
    activeChain === polkadotRelay
      ? stakeBalance.lte(BN_ZERO) || stakeBalance.gt(accountBalance.freeBalance)
      : stakeBalance.lt(minNominatorBond) ||
        stakeBalance.gt(accountBalance.freeBalance);

  return (
    <>
      <div className="flex gap-2">
        <Input
          type="number"
          label="Mennyiség"
          placeholder={
            activeChain === kusamaRelay
              ? `Írd be mennyit szeretnél stake-lni > ${humanReadableMinNominatorBond} ${tokenSymbol}`
              : `Írd be mennyit szeretnél stake-lni`
          }
          endContent={
            <>
              {tokenSymbol}
              {activeChain === kusamaRelay ? (
                <KusamaIcon className="pl-1 pt-1" />
              ) : (
                <PolkadotIcon className="pl-1 pt-1" />
              )}
            </>
          }
          //@ts-ignore
          onValueChange={setStakeAmount}
          size="sm"
          max={accountBalance.freeBalance}
          //@ts-ignore
          value={stakeAmount}
          step={0.01}
        />
        <Button
          onClick={stakeMax}
          variant="bordered"
          className="border-white h-12"
        >
          Maximális stake
        </Button>
      </div>
      {amountSmallerThanMinNominatorBond && kusamaRelay ? (
        <>
          <Tooltip
            content={`A ${humanReadableMinNominatorBond} ${tokenSymbol}
            alatti stake-ek nem rendelkeznek szavazati erővel(ettől még stake-elhetsz)`}
            size="sm"
            color="warning"
            radius="sm"
            placement="bottom"
          >
            <Button
              onClick={joinNominationPool}
              color="danger"
              isDisabled={isDisabled}
              size="lg"
            >
              Stake-elj a nomination pool-ban
            </Button>
          </Tooltip>
        </>
      ) : (
        <Button
          onClick={bondAndNominate}
          color="danger"
          isDisabled={isDisabled}
          size="lg"
        >
          Stake-elek a Polkadot Hungary-vel
        </Button>
      )}
    </>
  );
}

function AddKusToSet({
  nominators,
  validator,
  api,
  signer,
  activeAccount,
  tokenSymbol,
}: {
  nominators: string[];
  validator: string;
  api: ApiPromise | undefined;
  signer: Signer | undefined;
  activeAccount: InjectedAccount | null;
  tokenSymbol: string;
}) {
  return (
    <>
      <p>Great! You are already staking your {tokenSymbol}</p>
      <p>Would you like to add The Kus to your nominator set?</p>
      <Button
        onClick={async () => {
          const tx = await nominateTx(
            api,
            signer,
            activeAccount?.address,
            nominators.concat(validator)
          );
        }}
        color="danger"
        size="lg"
      >
        Add Kus to nominator set
      </Button>
    </>
  );
}

function ReplaceOneWithKus({
  nominators,
  validator,
  api,
  signer,
  activeAccount,
  activeChain,
}: {
  nominators: string[];
  validator: string;
  api: ApiPromise | undefined;
  signer: Signer | undefined;
  activeAccount: InjectedAccount | null;
  activeChain: SubstrateChain | undefined;
}) {
  const [selected, setSelected] = useState<string | undefined>();

  // const { data: identities } = useIdentities(nominators);
  // console.log("in modal: identities", identities);

  const nominate = async (targets: string[]) => {
    const tx = await nominateTx(api, signer, activeAccount?.address, targets);
  };

  const handleReplace = () => {
    if (selected) {
      const newTargets = nominators.map((item) =>
        item === selected ? validator : item
      );
      nominate(newTargets);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p>
        Your nominator set is full! Select one nomination to replace with Kus
        Validation
      </p>

      <RadioGroup
        label="Replace the following nominee"
        color="danger"
        size="sm"
        value={selected}
        onValueChange={setSelected}
      >
        {nominators?.map((address) => {
          // const { address, identity } = iden;
          return (
            <Radio value={address} key={address}>
              <span className="">{trimAddress(address, 8)} </span>
              <Link
                href={`//${activeChain}.subscan.io/account/${address}`}
                target="_blank"
                className="underline text-xs text-default-500"
              >
                👀 subscan ↗️
              </Link>
            </Radio>
          );
        })}
      </RadioGroup>
      <Button
        className="w-full"
        color="danger"
        onClick={handleReplace}
        isDisabled={!selected}
        size="lg"
      >
        Replace above with Kus
      </Button>
    </div>
  );
}
