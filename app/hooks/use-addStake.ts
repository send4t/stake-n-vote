import { useMutation, useQueryClient } from "react-query";
import { useInkathon } from "@scio-labs/use-inkathon";
import { BN } from "@polkadot/util";
import type { Codec } from '@polkadot/types/types';
import type { Option } from '@polkadot/types';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';

export function useAddStake() {
  const { api, activeAccount } = useInkathon();
  const queryClient = useQueryClient();

  return useMutation(
    async (amount: BN) => {
      if (!api || !activeAccount) throw new Error("API or Account not found");

      const { address } = activeAccount;

      // Fetch the pool ID for the user
      const poolMemberOpt = await api.query.nominationPools.poolMembers(address) as Option<PalletNominationPoolsPoolMember>;

      if (!poolMemberOpt.isSome) throw new Error("Pool ID not found");

      const poolMember = poolMemberOpt.unwrap();
      const poolId = poolMember.poolId;

      const extrinsic = api.tx.nominationPools.bondExtra({ FreeBalance: amount });
      return await extrinsic.signAndSend(address);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch staking info after a successful stake
        queryClient.invalidateQueries(["nominatedAddresses", activeAccount?.address]);
      },
    }
  );
}
