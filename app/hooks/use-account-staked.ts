import { useQuery } from "react-query";
import { encodeAddress } from "@polkadot/keyring";
import { useInkathon } from "@scio-labs/use-inkathon";

// Custom hook to fetch the accounts the user is currently staking with
export function useAccountNominators() {
  const { api, activeChain, activeAccount } = useInkathon();

  // Encode the user's address with the chain's SS58 prefix
  const userAddress =
    activeAccount?.address && activeChain?.ss58Prefix !== undefined
      ? encodeAddress(activeAccount.address, activeChain.ss58Prefix)
      : "";

  // Fetch staking information using react-query
  return useQuery(
    ["nominatedAddresses", userAddress, activeChain?.chainName],
    async () => {
      // Fetch staking information from the blockchain
      const stakingInfo = await api?.query.staking.nominators(userAddress);

      if (!stakingInfo || stakingInfo.isNone) {
        return [];
      }

      // Extract the target addresses from the staking information
      const { targets } = stakingInfo.unwrap();
      return targets.map((target) => target.toString());
    },
    {
      // Ensure the query runs only if api and userAddress are available
      enabled: !!api && !!userAddress,
    }
  );
}
