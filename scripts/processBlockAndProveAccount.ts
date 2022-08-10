import fetch from 'cross-fetch';
import fs from 'fs';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { ethers } from 'ethers';
import { utils } from '@snapshot-labs/sx';
import { defaultProvider, Account, ec, Call, RawCalldata } from 'starknet';

async function main() {
  global.fetch = fetch;

  const fossilFactRegistryAddress =
    '0x363108ac1521a47b4f7d82f8ba868199bc1535216bbedfc1b071ae93cc406fd';
  const fossilL1HeadersStoreAddress =
    '0x6ca3d25e901ce1fff2a7dd4079a24ff63ca6bbf8ba956efc71c1467975ab78f';

  const starkAccount = new Account(
    defaultProvider,
    process.env.ARGENT_X_ADDRESS!,
    ec.getKeyPair(process.env.ARGENT_X_PK!)
  );
  const ethAccount = new ethers.Wallet(process.env.ETH_PK_1!);

  const block = JSON.parse(fs.readFileSync('./test/data/blockGoerli.json').toString());
  const processBlockInputs: utils.storageProofs.ProcessBlockInputs =
    utils.storageProofs.getProcessBlockInputs(block);
  const proofs = JSON.parse(fs.readFileSync('./test/data/proofsGoerli.json').toString());
  const proofInputs: utils.storageProofs.ProofInputs = utils.storageProofs.getProofInputs(
    block.number,
    proofs
  );

  const { transaction_hash: txHash } = await starkAccount.execute(
    [
      {
        contractAddress: fossilL1HeadersStoreAddress,
        entrypoint: 'process_block',
        calldata: [
          processBlockInputs.blockOptions,
          processBlockInputs.blockNumber,
          processBlockInputs.headerInts.bytesLength,
          processBlockInputs.headerInts.values.length,
          ...processBlockInputs.headerInts.values,
        ],
      },
      {
        contractAddress: fossilFactRegistryAddress,
        entrypoint: 'prove_account',
        calldata: [
          proofInputs.accountOptions,
          proofInputs.blockNumber,
          proofInputs.ethAddress.values[0],
          proofInputs.ethAddress.values[1],
          proofInputs.ethAddress.values[2],
          proofInputs.accountProofSizesBytes.length,
          ...proofInputs.accountProofSizesBytes,
          proofInputs.accountProofSizesWords.length,
          ...proofInputs.accountProofSizesWords,
          proofInputs.accountProof.length,
          ...proofInputs.accountProof,
        ],
      },
    ],
    undefined,
    { maxFee: '857400005301800' }
  );
  console.log(txHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
