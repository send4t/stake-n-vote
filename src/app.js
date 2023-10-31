import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp';
const RPC_URL = 'wss://rpc.polkadot.io';
const keyring = new Keyring();

import './components/my-validator';
import './components/my-spinner';
import './components/my-address-chooser';
import './components/my-validator-list';

let suggestedValidators = [
    { name: 'Green Cloud', address: '1HtWJy6zTTc6Y1hyRTVpM6MDCpiWknsjDssUPC3FTKjfAGs' },
    { name: 'DRAGONSTAKE 🐲', address: '1dGsgLgFez7gt5WjX2FYzNCJtaCjGG6W9dA42d9cHngDYGg' },
    { name: 'Polkadot.pro - Realgar', address: '1REAJ1k691g5Eqqg9gL7vvZCBG7FCCZ8zgQkZWd4va5ESih' },
    { name: 'Ryabina', address: '14xKzzU1ZYDnzFj7FgdtDAYSMJNARjDc2gNw4XAFDgr4uXgp' },
    { name: 'General-Beck', address: '15MUBwP6dyVw5CXF9PjSSv7SdXQuDSwjX86v1kBodCSWVR7c' }
];

const validatorList = document.getElementById('validator-list');
validatorList.suggestedValidators = suggestedValidators;
const stakingSwitch = document.getElementById('staking-switch');
const delegationSwitch = document.getElementById('delegation-switch');

const addressChooser = document.getElementById('address-chooser');

const submitTransaction = document.getElementById('submit-transaction');

const TD = new TextDecoder();

let allAccounts = [];
let rpc_api = null;
let selectedAccount = null;

async function initWallets() {
    const Wallet_Extensions = await web3Enable("Stake'n'Vote by The Kusamarian");
    if (Wallet_Extensions.length === 0) {
        addressChooser.initialized = true; // Needed so we can show the "No wallets found" message in the address chooser
        return;
    }
    allAccounts = await web3Accounts();

    addressChooser.accounts = allAccounts;
    if (allAccounts.length > 0) {
        addressChooser.onAccountChange = async (account) => {
            selectedAccount = account;
            getNominations(account.address);
            console.log(selectedAccount.meta.name);
        }
        addressChooser.onAccountChange(allAccounts[0]);
        getNominations(allAccounts[0].address);
    };

    addressChooser.initialized = true;
}

async function getIdentity(address) {
    // We handle both cases of the address having an identity on its own,
    // or it being a subidentity of another address with its own identity.
    let identity = await rpc_api?.query.identity.identityOf(address);
    if (!identity || !identity.isSome) {
        identity = await rpc_api?.query.identity.superOf(address);
        if (!identity || !identity.isSome) {
            return;
        }
        // TODO: Handle the subidentity name together with the root identity name here somehow.

        identity = await rpc_api?.query.identity.identityOf(identity.unwrap()[0]);
        if (!identity || !identity.isSome) {
            return;
        }
    }
    identity = identity.unwrap();

    // TODO: only show identities which have a "Reasonable" or "KnownGood" judgement.
    // let judgements = await rpc_api?.query.identity.judgements(identity);
    // if (!judgements || !judgements.isSome) {
    //     return;
    // }
    // judgements = judgements.unwrap();
    // // Only proceed if there is at least one "Reasonable" or "KnownGood" judgement.
    // if (!(judgements.some(([, judgement]) => judgement.isReasonable || judgement.isKnownGood))) {
    //     return;
    // }

    return {
        address: address,
        name: TD.decode(identity.info.display.asRaw),
    }

}

async function getNominations(address) {
    let nominators = await rpc_api.query.staking.nominators(address);
    if (!nominators || !nominators.isSome) {
        const currentBalance = await rpc_api.query.system.account(address).then((account) => account.data.free);
        const chainDecimals = rpc_api.registry.chainDecimals;
        const amountToStake = Math.max(currentBalance * 0.9, currentBalance - 10 * Math.pow(10, chainDecimals));
        const requiredToStake = await rpc_api.query.staking.minNominatorBond();
        if (amountToStake < requiredToStake) {
            validatorList.validationOptions = {
                type: 'not-enough-to-stake',
                totalAmount: currentBalance,
                requiredToStake: requiredToStake,
                chainDecimals: chainDecimals
            };
            stakingSwitch.disabled = true;
        } else {
            validatorList.validationOptions = {
                type: 'no-staking-yet',
                totalAmount: currentBalance,
                amountToStake: amountToStake,
                chainDecimals: chainDecimals
            };
            stakingSwitch.disabled = false;
        };
        return;
    }

    nominators = nominators.unwrap();
    // TODO: exclude the existing nominations from the suggested validators
    let targets = nominators.targets.map((target) => keyring.encodeAddress(target, 0)); // 0 is Polkadot SS58 format; don't forget to change it if you're using Kusama
    targets = targets.map(async (target) => {
        return await getIdentity(target);
    });
    targets = await Promise.all(targets);
    validatorList.validationOptions = {
        type: 'staking',
        currentValidators: targets.filter((target) => target !== undefined),
    };
    stakingSwitch.disabled = false;
}

async function initBlockchain() {
    const RPC_Provider = new WsProvider(RPC_URL);
    rpc_api = await ApiPromise.create({ provider: RPC_Provider });
    await initWallets();
}
initBlockchain();

submitTransaction.addEventListener('click', async () => {
    const currentBalance = await rpc_api?.query.system.account(selectedAccount.address).then((account) => account.data.free);
    const chainDecimals = rpc_api.registry.chainDecimals;
    const amountToStake = Math.round(Math.max(currentBalance * 0.9, currentBalance - 10 * Math.pow(10, chainDecimals)));

    let transactions = [];
    if (stakingSwitch.checked) {
        transactions.push(rpc_api?.tx.staking.bond(amountToStake, 'Staked'));
        let newNominations = suggestedValidators.map((validator) => validator.address);
        if (validatorList.validationOptions.type === 'staking') {
            newNominations = newNominations.concat(validatorList.validationOptions.currentValidators.map((validator) => validator.address));
        };
        transactions.push(rpc_api?.tx.staking.nominate(newNominations));
    };
    if (delegationSwitch.checked) {
        // TODO: replace with the actual Kusamarian delegation address
        // TODO: do we want a switch for the conviction level?
        transactions.push(rpc_api?.tx.democracy.delegate(selectedAccount.address, "Locked6x", amountToStake));
    };
    if (stakingSwitch.checked || delegationSwitch.checked) {
        transactions.push(rpc_api?.tx.system.remarkWithEvent('Stake\'n\'Vote by The Kusamarian'));
    } else {
        // No switches are checked, so we don't need to submit any transactions.
        return;
    }

    const transaction = rpc_api?.tx.utility.batch(transactions);
    const injector = await web3FromSource(selectedAccount.meta.source);
    transaction?.signAndSend(selectedAccount.address, { signer: injector.signer }, ({ status }) => console.log(status))
        .catch((error) => {
            console.log(':( transaction failed', error);
        });
});