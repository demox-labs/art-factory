import { useState, useEffect, ChangeEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button from '@/components/ui/button';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import { padArray, safeParseInt, splitStringToBigInts, stringToBigInt } from '@/lib/util';
import { TESTNET3_API_URL, getTransactionsForProgram } from '@/aleo/rpc';
import useSWR from 'swr';


const Initialize: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('intializeCollection', () => getTransactionsForProgram(NFTProgramId, 'initialize_collection', TESTNET3_API_URL));

  let [total, setTotal] = useState(1000);
  let [symbol, setSymbol] = useState('');
  let [url, setUrl] = useState('');
  let [fee, setFee] = useState<number>(0.05);
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

    const symbolInput = stringToBigInt(symbol);
    const urlInputs = padArray(splitStringToBigInts(url), 4);
    const formattedUrlInput = `{ data0: ${urlInputs[0]}u128, data1: ${urlInputs[1]}u128, data2: ${urlInputs[2]}u128, data3: ${urlInputs[3]}u128 }`;
    const inputs = [`${total}u128`, `${symbolInput}u128`, formattedUrlInput];

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NFTProgramId,
      'initialize_collection',
      inputs,
      Math.floor(fee! * 1_000_000),
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
      <NextSeo
        title="Initialize NFT Collection"
        description="Initialize with the Leo Wallet"
      />
      <Base>
        {isLoading && <p>Loading...</p>}
        {!isLoading && data && data[0] && 
          <div className="relative flex w-full flex-col rounded-full md:w-auto text-center p-8">
            {`${NFTProgramId}`} is already initialized <a target="_blank" rel="noopener noreferrer" className="underline mt-4" href={`https://explorer.hamp.app/transition?id=${data[0].transition_id}`}>View on Explorer</a>
          </div>
        }
        {!isLoading && (!data || !data[0]) &&
          <form
            noValidate
            role="search"
            onSubmit={handleSubmit}
            className="relative flex w-full flex-col rounded-full md:w-auto"
          >
            <label className="flex w-full items-center justify-between py-4">
              Maximum Number of Items:
              <input
                className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                onChange={(event) => setTotal(safeParseInt(event.currentTarget.value))}
                value={total}
              />
            </label>

            <label className="flex w-full items-center justify-between py-4">
              Symbol:
              <input
                className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                placeholder="LION"
                onChange={(event) => setSymbol(event.currentTarget.value)}
                value={symbol}
              />
            </label>

            <label className="flex w-full items-center justify-between py-4">
              Url:
              <input
                className="w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                placeholder="The base url for your NFTs ie: aleo-public.s3.us-west-2.amazonaws.com/testnet3/"
                onChange={(event) => setUrl(event.currentTarget.value)}
                value={url}
              />
            </label>

            <label className="flex w-full items-center justify-between py-4">
              Fee:
              <input
                className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                placeholder="Fee (in microcredits)"
                onChange={(event) =>
                  setFee(parseFloat(event.currentTarget.value))
                }
                value={fee}
              />
            </label>
            <div className="flex items-center justify-center">
              <Button
                disabled={
                  !publicKey ||
                  !total ||
                  !symbol ||
                  !url ||
                  fee === undefined
                }
                type="submit"
                className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
              >
                {!publicKey ? 'Connect Your Wallet' : 'Submit'}
              </Button>
            </div>
          </form>
        }

        {transactionId && (
          <div>
            <div>{`Transaction status: ${status}`}</div>
          </div>
        )}
      </Base>
    </>
  );
};

Initialize.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Initialize;
