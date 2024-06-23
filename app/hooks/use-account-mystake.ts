import { useQuery } from "react-query";
import { encodeAddress } from "@polkadot/keyring";
import { useInkathon } from "@scio-labs/use-inkathon";
import type { Option } from '@polkadot/types';
import type { PalletStakingNominations, PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';
import { BN, BN_ZERO } from "@polkadot/util";
import { Compact } from '@polkadot/types/codec';

interface NominatorInfo {
  nominators: string[];
  pool: string | null;
  stakedAmount: BN;
}

export function useAccountMyStakes() {
  const { api, activeChain, activeAccount } = useInkathon();

  const userAddress =
    activeAccount?.address && activeChain?.ss58Prefix !== undefined
      ? encodeAddress(activeAccount.address, activeChain?.ss58Prefix)
      : "";

  return useQuery<NominatorInfo>(
    ["nominatedAddresses", userAddress, activeChain],
    async (): Promise<NominatorInfo> => {
      if (!api || !userAddress) {
        return { nominators: [], pool: null, stakedAmount: BN_ZERO };
      }

      // Fetch individual staking information
      const stakingInfoOpt = await api.query.staking.nominators(userAddress) as Option<PalletStakingNominations>;

      let nominators: string[] = [];
      let stakedAmount = BN_ZERO;
      if (stakingInfoOpt.isSome) {
        const stakingInfo = stakingInfoOpt.unwrap();
        const { targets } = stakingInfo;
        nominators = targets.map((target: any) => target.toString());
      }

      // Fetch staked amount
      const ledgerOpt = await api.query.staking.ledger(userAddress);
      if (ledgerOpt.isSome) {
        const ledger = ledgerOpt.unwrap();
        stakedAmount = ledger.total.toBn();
      }

      // Fetch pool staking information
      const poolStakingInfoOpt = await api.query.nominationPools.poolMembers(userAddress) as Option<PalletNominationPoolsPoolMember>;

      let pool: string | null = null;
      if (poolStakingInfoOpt.isSome) {
        const poolStakingInfo = poolStakingInfoOpt.unwrap();
        pool = poolStakingInfo.poolId.toString();
        
        // Fetch the user's contribution within the pool
        const poolMemberOpt = await api.query.nominationPools.poolMembers(userAddress) as Option<PalletNominationPoolsPoolMember>;
        if (poolMemberOpt.isSome) {
          const poolMember = poolMemberOpt.unwrap();
          const poolStake = poolMember.points.toBn();
          stakedAmount = poolStake;
        }
      }

      return { nominators, pool, stakedAmount };
    },
    {
      enabled: !!api && !!userAddress,
      refetchOnWindowFocus: true,
    }
  );
}
