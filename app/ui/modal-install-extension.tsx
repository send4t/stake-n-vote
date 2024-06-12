import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalProps,
} from "@nextui-org/modal";
type ModalPropType = Omit<ModalProps, "children">;

export function ModalInstallExtension(props: ModalPropType) {
  const { isOpen, onOpenChange } = props;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      scrollBehavior="inside"
      backdrop="blur"
      className="bg-gradient-to-r from-[#105b5d] to-[#9a1c54]"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-white">
              Telepíts egy kompatibilis pénztárcát
            </ModalHeader>
            <ModalBody className="text-sm mb-4">
              <p>
              Kattints a csatlakozásra a jobb felső sarokban vagy töltsd le
              </p>
              <p>
                <a
                  className="underline"
                  href="https://www.talisman.xyz/download"
                  target="_blank"
                >
                  a Talisman bővítményt
                </a>{" "}
                (Asztali gépre) vagy <br />
                <a
                  className="underline"
                  href="https://novawallet.io/"
                  target="_blank"
                >
                  {" "}
                  Nova Wallet
                </a>{" "}
                (mobil-ra)
              </p>
              <p>adj engedélyt az oldalnak és csatlakozz</p>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
