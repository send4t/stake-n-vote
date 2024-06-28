import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
} from "@nextui-org/modal";
import { useEffect, useState } from 'react';
import styles from "./modal.module.scss";
import StakingRewardCalculator from "./form-calc";
import useAccountBalances from "@/app/hooks/use-account-balance";
import { BN_ZERO, formatBalance } from "@polkadot/util";
import { parseBN } from "@/app/util";
import { CHAIN_CONFIG } from "@/app/config";
import { NotConnected } from "./not-connected";
import { useInkathon } from "@scio-labs/use-inkathon";

type ModalPropType = Omit<ModalProps, "children">;

export function usePolkadotPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd');
        const data = await response.json();
        setPrice(data.polkadot.usd);
      } catch (err) {
        setError(new Error('An error occurred while fetching the Polkadot price'));
      } finally {
        setLoading(false);
      }
    };
    fetchPrice();
  }, []);

  return { price, loading, error };
}

export default function ModalCalc(props: ModalPropType) {
  const { isOpen, onOpenChange } = props;
  const { data: accountBalance } = useAccountBalances();
  const { activeAccount, activeChain } = useInkathon();
  const { price, loading: priceLoading, error: priceError } = usePolkadotPrice();

  const {
    tokenSymbol,
    tokenDecimals,
  } = CHAIN_CONFIG[activeChain?.network || "Polkadot"] || {};

  const humanFreeBalance = accountBalance ? parseBN(accountBalance.freeBalance, tokenDecimals) : 0;

  if (priceError) {
    return <div>Nem sikerült lekérni a Polkadot árát {priceError.message}</div>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className={styles.modal}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex text-white flex-col gap-1">
          <span className="text-xs text-gray-300">
            {activeAccount ? (
              <>
                {humanFreeBalance.toFixed(2)} {tokenSymbol} elérhető
                {price && ` - Polkadot ár: $${price.toFixed(2)}`}
              </>
            ) : (
              'Ha csatlakoztatod a tárcád, látni fogod mennyi DOT-ot stake-elhetsz'
            )}
          </span>
        </ModalHeader>
        <ModalBody className="text-sm mb-4 text-white">
          <StakingRewardCalculator price={price} />
          <p className="my-2 text-center text-xs">
            Csatlakozz hozzánk és formáld velünk a Polkadot-ot! <br />
            <a className="underline" href="https://t.me/polkadothungary" target="_blank" rel="noopener noreferrer">
              Telegram csatornánk
            </a>
          </p>
          { !activeAccount}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
