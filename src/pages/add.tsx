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
import {padArray, safeParseInt, splitStringToBigInts } from '@/lib/util';
import useSWR from 'swr';
import { TESTNET3_API_URL, getNFTs } from '@/aleo/rpc';
import BulkAdd from '@/components/ui/forms/bulk-add';


const Add: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('getAllNFTs', () => getNFTs(TESTNET3_API_URL));

  let [url, setUrl] = useState('');
  let [editions, setEditions] = useState(0);
  let [fee, setFee] = useState<string>('3.52');
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

    const urlInputs = padArray(splitStringToBigInts(url), 2);
    const formattedUrlInput = `{ data1: ${urlInputs[0]}u128, data2: ${urlInputs[1]}u128 }`;
    const inputs = [formattedUrlInput, `${editions}scalar`];

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NFTProgramId,
      'add_nft',
      inputs,
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
      <NextSeo
        title="Add NFT"
        description="Add an NFT with the Leo Wallet"
      />
      <Base key="form">
        <div className='flex'>
          <div className='px-4 w-1/2'>
            <form
              noValidate
              role="search"
              onSubmit={handleSubmit}
              className="relative flex w-full flex-col rounded-full md:w-auto"
            >
              <div className='text-center text-lg'>Upload 1 NFT</div>
              <label className="flex w-full items-center justify-between py-4">
                Url:
                <input
                  className="w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                  placeholder="The relative url to your NFT ie: privacy-pride/1.json"
                  onChange={(event) => setUrl(event.currentTarget.value)}
                  value={url}
                />
                </label>

              <label className="flex w-full items-center justify-between py-4">
                Edition:
                <input
                  className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                  onChange={(event) => setEditions(safeParseInt(event.currentTarget.value))}
                  value={editions}
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
          </div>
          <div className='px-4 w-1/2'>
            <BulkAdd />
          </div>
        </div>
        {transactionId && (
          <div>
            <div>{`Transaction status: ${status}`}</div>
          </div>
        )}
      </Base>
      {data && data.nfts &&
        <Base key="list">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Current NFTs
            </h2>
            <div key={'headers'} className="flex w-full underline items-center justify-between my-4">
              <div className="w-1/5">
                Image
              </div>
              <div className="w-3/5">
                NFT Url
              </div>
              <div className="w-1/5">
                Edition
              </div>
            </div>
            {data.nfts.map((item: any, index: number) => (
              <div key={index} className="flex w-full items-center justify-between my-2">
                <div className="w-1/5">
                  <a target="_blank" rel="noopener noreferrer" href={`${item.properties.image}`}><img src={`${item.properties.image}`} style={{width: '100px' }} /></a>
                </div>
                <div className="w-3/5">
                  <a target="_blank" rel="noopener noreferrer" href={`https://${item.url}`}>{`https://${item.url}`}</a>
                </div>
                <div className="w-1/5">
                  {item.edition}
                </div>
              </div>
            ))}
          </div>
        </Base>
      }
    </>
  );
};

Add.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Add;
