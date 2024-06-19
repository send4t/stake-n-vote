"use client";

import { ChainSwitch } from "./chain-switch";
import { DelegateStakeButtons } from "./buttons";

export function DelegateAndStake() {
  return (
    <>
      {" "}
      <div className="max-w-xl mt-[10vh] mb-[10vh]">
        <h2 className={`text-center text-white mb-12 text-xl font-bold`}>
          DOT tokenedet stake-eld a Polkadot Hungary-vel!
        </h2>
        <ChainSwitch />
        <DelegateStakeButtons />
      </div>
    </>
  );
}
