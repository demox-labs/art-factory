import { useState, useEffect, ChangeEvent } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button from '@/components/ui/button';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import useSWR from 'swr';
import { TESTNET3_API_URL, getMintBlock } from '@/aleo/rpc';

const MintBlock = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('getMintBlock', () => getMintBlock(TESTNET3_API_URL));

  let [block, setBlock] = useState<number | undefined>();
  let [fee, setFee] = useState<string>('2.50');
  let [transactionId, setTransactionId] = useState<string | undefined>();
  let [status, setStatus] = useState<string | undefined>();

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId!);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactionId]);

  const handleSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    if (!data) throw new Error('No current mint block');

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NFTProgramId,
      'set_mint_block',
      [`${block}u128`],
      Math.floor(parseFloat(fee)! * 1_000_000),
    );

    const txId =
      (await (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      )) || '';
    setTransactionId(txId);
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(txId);
    setStatus(status);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Mint Block: { data && data.block }
        </h2>
      </div>
      <form
        noValidate
        role="search"
        onSubmit={handleSubmit}
        className="relative flex w-full flex-col rounded-full md:w-auto"
      >
        <label className="flex w-full items-center justify-between py-4">
          Block to start minting:
          <input
            className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="Block height"
            onChange={(event) =>
              setBlock(parseInt(event.currentTarget.value))
            }
            value={block}
          />
        </label>
        <label className="flex w-full items-center justify-between py-4">
          Fee:
          <input
            className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="Fee (in microcredits)"
            onChange={(event) => {
              if (/^\d*(\.\d*)?$/.test(event.currentTarget.value)) { setFee(event.currentTarget.value) }
            }}
            value={fee}
          />
        </label>
        <div className="flex items-center justify-center">
          <Button
            disabled={
              !publicKey ||
              fee === undefined
            }
            type="submit"
            className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
          >
            {!publicKey ? 'Connect Your Wallet' : 'Set Mint Block'}
          </Button>
        </div>
      </form>

      {transactionId && (
        <div>
          <div>{`Transaction status: ${status}`}</div>
        </div>
      )}
    </>
  );
};


export default MintBlock;