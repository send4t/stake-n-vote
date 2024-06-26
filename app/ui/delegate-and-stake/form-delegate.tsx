"use client";

import { Select, SelectItem } from "@nextui-org/select";
import { Input } from "@nextui-org/input";
import { Slider } from "@nextui-org/slider";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { useState } from "react";
import { sendDelegateTx } from "@/app/txs/txs";
import { BN_ZERO, bnToBn } from "@polkadot/util";
import {
  CHAIN_CONFIG,
  KUSAMA_DELEGATOR,
  POLKADOT_DELEGATOR,
} from "@/app/config";
import { findChangedItem, parseBN } from "@/app/util";
import { useTracks } from "@/app/hooks/use-tracks";
import useAccountBalances from "@/app/hooks/use-account-balance";
import { KusamaIcon, PolkadotIcon } from "../icons";
import { Switch } from "@nextui-org/switch";
import { useInkathon } from "@scio-labs/use-inkathon";
import { kusamaRelay } from "@/app/lib/chains";
import { FaInfoCircle } from "react-icons/fa";

const ALL_TRACKS_ID = 9999;

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export function submitDelegation(prevState: State, formData: FormData) {
  return {
    errors: {
      status: ["Delegálás sikertelen"],
    },
    message: null,
  };
}

export default function FormDelegate() {
  const {
    data: accountBalance,
    isLoading: isAccountBalanceLoading,
    isFetching: isAccountBalanceFetching,
    isSuccess: isAccountBalanceSuccess,
  } = useAccountBalances();

  const { data: trackOptions } = useTracks() || [];
  const ALL_TRACKS = trackOptions?.map((track) => track.id.toString()) || [
    ALL_TRACKS_ID.toString(),
  ];

  const [amount, setAmount] = useState(1);
  const [tracks, setTracks] = useState(new Set<string>(ALL_TRACKS));
  const [isAllSelected, setIsAllSelected] = useState(true);

  const { activeAccount, activeSigner, activeChain, api } = useInkathon();
  const activeChainConfig = CHAIN_CONFIG[activeChain?.network || "Polkadot"];

  const { tokenSymbol, tokenDecimals } = activeChainConfig;

  const [conviction, setConviction] = useState<number>(
    activeChain === kusamaRelay ? 1 : 3
  );

  const delegateBalance =
    !isNaN(amount) && amount !== 0
      ? bnToBn(amount * Math.pow(10, tokenDecimals))
      : BN_ZERO;
  const { freeBalance } = accountBalance || { freeBalance: "0" };

  const delegateToTheKus = async () => {
    const target =
      activeChain === kusamaRelay ? KUSAMA_DELEGATOR : POLKADOT_DELEGATOR;

    let tracksArray = Array.from(tracks);

    if (tracksArray.includes(ALL_TRACKS_ID.toString())) {
      tracksArray = ALL_TRACKS;
    }

    const tx = await sendDelegateTx(
      api,
      activeSigner,
      activeAccount?.address,
      tracksArray,
      target,
      conviction,
      delegateBalance
    );
  };

  const effectiveVotes = conviction !== 0 ? amount * conviction : amount * 0.1;

  const marks = [
    {
      value: 0,
      label: "0.1x",
      description: "Lezárás nélkül",
    },
    {
      value: 1,
      label: "1x",
      description: "7 napig lezárva",
    },
    {
      value: 2,
      label: "2x",
      description: "14 napig lezárva",
    },
    {
      value: 3,
      label: "3x",
      description: "28 napig lezárva",
    },
    {
      value: 4,
      label: "4x",
      description: "56 napig lezárva",
    },
    {
      value: 5,
      label: "5x",
      description: "112 napig lezárva",
    },
    {
      value: 6,
      label: "6x",
      description: "224 napig lezárva",
    },
  ];

  const handleSelectionChange = (selectedTracks: Set<string>) => {
    const changedItem = findChangedItem(tracks, selectedTracks);

    if (changedItem.includes(ALL_TRACKS_ID.toString())) {
      if (selectedTracks.has(ALL_TRACKS_ID.toString())) {
        setTracks(new Set([ALL_TRACKS_ID.toString()]));
      } else {
        selectedTracks.delete(ALL_TRACKS_ID.toString());
        setTracks(new Set(selectedTracks));
      }
    } else {
      if (
        selectedTracks.has(ALL_TRACKS_ID.toString()) &&
        selectedTracks.size > 1
      ) {
        selectedTracks.delete(ALL_TRACKS_ID.toString());
      }
      setTracks(new Set(selectedTracks));
    }
  };

  const delegateMax = () => {
    setAmount(parseBN(freeBalance?.toString(), tokenDecimals));
  };

  const trackOptionsWithAll = [
    { id: ALL_TRACKS_ID, name: "Összes témakör" },
    ...(trackOptions || []),
  ];

  return (
    <form className="flex flex-col gap-5 text-white">
      <div className="flex items-center gap-2">
        <Switch
          isSelected={isAllSelected}
          onValueChange={setIsAllSelected}
          color="danger"
        >
          Összes témakör
        </Switch>
        <Tooltip
          content="A témakörök különböző döntéshozatali területek, amelyekben delegálhatod a szavazati jogaidat."
          color="danger"
        >
          <span>
            <FaInfoCircle size={18} />
          </span>
        </Tooltip>
      </div>
      {!isAllSelected && (
        <Select
          label="Tracks"
          placeholder="Válaszd ki a témakört"
          selectionMode="multiple"
          size="sm"
          classNames={{ description: "text-foreground-600" }}
          description="Válaszd ki milyen témakörben delegálsz"
          selectedKeys={tracks}
          // @ts-ignore
          onSelectionChange={handleSelectionChange}
        >
          {trackOptionsWithAll.map((track) => {
            return (
              <SelectItem key={track.id} value={track.id}>
                {track.name}
              </SelectItem>
            );
          })}
        </Select>
      )}

      <div className="flex flex-row gap-3 w-full max-w-full">
        <div className="flex gap-2 w-full">
          <Input
            size="sm"
            type="number"
            label="Összeg"
            placeholder="Írd be a delegálni kívánt összeget"
            classNames={{ description: "text-foreground-600" }}
            value={amount.toString()}
            onChange={(e) => setAmount(parseInt(e.target.value))}
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
          />
          <Button
            onClick={delegateMax}
            variant="bordered"
            className="border border-2 border-white  h-12 px-4"
            size="sm"
            isDisabled={!isAccountBalanceSuccess}
          >
            Maximum delegálás
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full max-w-full">
        <Slider
          label="Nyomaték"
          color="danger"
          step={1}
          maxValue={6}
          showOutline={true}
          showSteps={true}
          marks={marks}
          //   defaultValue={1}
          value={conviction}
          onChange={(value) => setConviction(value as number)}
          getValue={(conviction) =>
            `${marks[conviction as number].description}`
          }
          className="max-w-full"
          classNames={{ track: "bg-default-100" }}
        />
      </div>
      <div className="w-full flex gap-2 items-end">
        <Button
          color="danger"
          className="w-full"
          onClick={delegateToTheKus}
          isDisabled={!isAccountBalanceSuccess}
        >
          Delegálok {effectiveVotes}{" "}
          {effectiveVotes !== 1 ? "szavazatot" : "szavazatot"}
        </Button>
      </div>
    </form>
  );
}
