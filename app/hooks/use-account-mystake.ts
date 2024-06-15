import { useQuery } from "react-query";
import { encodeAddress } from "@polkadot/keyring";
import { useInkathon } from "@scio-labs/use-inkathon";
import type { Option } from '@polkadot/types';
import type { PalletStakingNominations, PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';

interface NominatorInfo {
  nominators: string[];
  pool: string | null;
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
        return { nominators: [], pool: null };
      }

      // Fetch individual staking information
      const stakingInfoOpt = await api.query.staking.nominators(userAddress) as Option<PalletStakingNominations>;

      let nominators: string[] = [];
      if (stakingInfoOpt.isSome) {
        const stakingInfo = stakingInfoOpt.unwrap();
        const { targets } = stakingInfo;
        nominators = targets.map((target: any) => target.toString());
      }

      // Fetch pool staking information
      const poolStakingInfoOpt = await api.query.nominationPools.poolMembers(userAddress) as Option<PalletNominationPoolsPoolMember>;

      let pool: string | null = null;
      if (poolStakingInfoOpt.isSome) {
        const poolStakingInfo = poolStakingInfoOpt.unwrap();
        pool = poolStakingInfo.poolId.toString();
      }

      return { nominators, pool };
    },
    {
      enabled: !!api && !!userAddress,
      refetchOnWindowFocus: true,
    }
  );
}
