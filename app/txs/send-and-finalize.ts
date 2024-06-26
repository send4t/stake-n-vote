import { ApiPromise, WsProvider } from "@polkadot/api";
import { Signer, SubmittableExtrinsic } from "@polkadot/api/types";

import { Header } from "@polkadot/types/interfaces";
import toast from "react-hot-toast";

export interface SendAndFinalizeResult {
  status: string;
  message: string;
  txHash?: string;
  events?: any[];
  blockHeader?: Header;
  toast?: ToastType;
}

export type ToastType = {
  title: string;
  messages: {
    signing: string;
    entering: string;
    finalizing: string;
    success: string;
    error: string;
  };
};

export const DEFAULT_TOAST = {
  title: "Tranzakció feldolgozása",
  messages: {
    signing: "1/3 Aláírásra vár",
    entering: "2/3 Várj amíg a tranzakciót felveszi egy blokk",
    finalizing: "3/3 Blokk végelesítésre vár",
    success: "Sikeres tranzakció",
    error: "Óh jaj!",
  },
};

export async function sendAndFinalize(
  api: ApiPromise | undefined,
  tx: SubmittableExtrinsic<"promise"> | undefined,
  signer: Signer | undefined,
  address: string | undefined,
  toastConfig: ToastType = DEFAULT_TOAST,
  cb?: (res: any) => void
): Promise<SendAndFinalizeResult> {
  if (!api || !signer || !address) {
    return {
      status: "error",
      message: "Hiányzó API, aláíró vagy cím",
    };
  }

  await api.isReady;

  let toastId: string | undefined = undefined;
  let success = false;
  let included = [];
  let blockHeader: Header | undefined = undefined;

  const { messages } = toastConfig;

  if (toastConfig) {
    toastId = toast.loading(messages.signing, {
      // @ts-ignore
      title: toast.title,
      className: "toaster",
    });
  }

  let res: SendAndFinalizeResult = {
    status: "error",
    message: "Sikertelen tranzakció",
  };

  try {
    if (api && tx && signer && address) {
      const unsub = await tx.signAndSend(
        address,
        { signer },
        async (result) => {
          const { status, dispatchError, events = [], txHash } = result;
          console.log("Tranzakció állapota", status);
          if (status.isReady) {
            if (toastId) {
              toast.loading(messages.entering, {
                id: toastId,
              });
            }
          } else if (status.isInBlock) {
            success = dispatchError ? false : true;
            const signedBlock = await api?.rpc.chain.getBlock(status.asInBlock);
            blockHeader = signedBlock?.block.header;
            included = [...events];
            if (toastId) {
              toast.loading(messages.finalizing, {
                id: toastId,
                duration: undefined,
              });
            }
          } else if (status.isFinalized) {
            console.log(
              `Transaction included at blockHash ${status.asFinalized}`
            );
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`)
            // });

            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api?.registry.findMetaError(
                  dispatchError.asModule
                );
                const { docs, name, section } = decoded || {};

                res = {
                  status: "error",
                  message: docs?.join(" ") || "Ismeretlen hiba",
                };

                console.trace("dispatch error", decoded);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info

                res = {
                  status: "error",
                  message: dispatchError.toString(),
                };
              }
              toast.error(res.message, {
                // @ts-ignore
                title: messages.error,
                className: "toaster",
                id: toastId,
              });

              console.error(`${messages.error}: ${res.message}`);
            } else {
              // console.log(
              //   "finalized and no dispatch error, toasting with id",
              //   toastId
              // );
              if (toastId) {
                toast.success(messages.success, {
                  // @ts-ignore
                  title: toast.title,
                  id: toastId,
                  duration: 4000,
                });
              }

              res = {
                status: "success",
                message: `Sikeres tranzakció`,
                events,
                txHash: txHash.toString(),
                blockHeader,
              };
            }
          }
        }
      );
    }
  } catch (error) {
    console.log(error);
    toast.error(`${error}`, {
      // @ts-ignore
      title: toast.title,
      className: "toaster",
      id: toastId,
    });

    console.error(`${messages.error}: ${res.message}`);

    res = {
      status: "error",
      message: "Tranzakció nem sikerült",
    };

    cb?.(res);
  }

  // console.log("returning from sendAdnFinalize", res);
  return res;
}
