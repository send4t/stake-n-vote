import Image from "next/image";
import { clsx } from "clsx";
import { SubstrateChain, useInkathon } from "@scio-labs/use-inkathon";
import { kusamaRelay, polkadotRelay, rocoRelay } from "@/app/lib/chains";
import { isDev } from "@/app/config";

export function ChainSwitch() {
  const { activeChain, switchActiveChain } = useInkathon();

  function handleChainChange(chain: SubstrateChain) {
    switchActiveChain?.(chain || polkadotRelay);
  }

  return (
    <div className="flex gap-4 justify-center">
      <button
        className={clsx(
          "rounded-full hover:outline-2 border-3 border-transparent w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 p-2 md:p-3 hover:rotate-6 hover:scale-105 transition-all",
          {
            "border-white": activeChain === polkadotRelay,
            "opacity-50": activeChain !== polkadotRelay,
          }
        )}
        onClick={() => handleChainChange(polkadotRelay)}
      >
        <Image
          src="polkadot.svg"
          alt="Polkadot Logo"
          width={100}
          height={100}
          className="-mt-0.5"
        />
      </button>
      
      
    </div>
  );
}
