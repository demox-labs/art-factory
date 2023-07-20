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
import { TESTNET3_API_URL, getSettingsStatus } from '@/aleo/rpc';
import { convertSettingsToNumber, getSettingsFromNumber } from '@/lib/util';

const FreezeStatus = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('getSettingsStatus', () => getSettingsStatus(TESTNET3_API_URL));

  let [fee, setFee] = useState<string>('2');
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

    if (!data) throw new Error('No current freeze status');

    let settings = getSettingsFromNumber(data);
    settings.frozen = !settings.frozen;
    const newStatus = convertSettingsToNumber(settings) + 'u32';

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NFTProgramId,
      'update_toggle_settings',
      [newStatus],
      Math.floor(parseFloat(fee) * 1_000_000),
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
          Contract Frozen? : { data && (getSettingsFromNumber(data).whiteList ? 'Yes': 'No')}
        </h2>
      </div>
      <form
        noValidate
        role="search"
        onSubmit={handleSubmit}
        className="relative flex w-full flex-col rounded-full md:w-auto"
      >
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
            {!publicKey ? 'Connect Your Wallet' : 'Toggle Mint Status'}
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


export default FreezeStatus;