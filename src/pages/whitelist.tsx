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
import {safeParseInt } from '@/lib/util';
import useSWR from 'swr';
import { TESTNET3_API_URL, getMintedNFTs, getWhitelist } from '@/aleo/rpc';
import BulkWhitelist from '@/components/ui/forms/bulk-whitelist';
import CSVExportButton from '@/components/ui/button/csv-export';


const Whitelist: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('getWhitelist', () => getWhitelist(TESTNET3_API_URL));

  let [address, setAddress] = useState('');
  let [total, setTotal] = useState(1);
  let [fee, setFee] = useState<string>('1.504');
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

    const inputs = [address, `${total}u8`];

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NFTProgramId,
      'add_minter',
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
        title="Whitelist NFT Collection"
        description="Whitelist with the Leo Wallet"
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
              <div className='text-center text-lg'>Upload 1 Whitelisted Address</div>
              <label className="flex w-full items-center justify-between py-4">
                Address:
                <input
                  className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                  placeholder="aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey"
                  onChange={(event) => setAddress(event.currentTarget.value)}
                  value={address}
                />
              </label>

              <label className="flex w-full items-center justify-between py-4">
                Max NFTs:
                <input
                  className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                  onChange={(event) => setTotal(safeParseInt(event.currentTarget.value))}
                  value={total}
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
                    !total ||
                    !address ||
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
            <BulkWhitelist />
          </div>
        </div>

        {transactionId && (
          <div>
            <div>{`Transaction status: ${status}`}</div>
          </div>
        )}
      </Base>
      {data && data.length > 0 && (
        <Base key="list">
          <div className="flex flex-col items-center justify-center">
            <div className='flex justify-between w-full'>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Whitelist
              </h2>
              <div className="my-4">
                <CSVExportButton data={data} filename='whitelist.csv' />
              </div>
            </div>
            <div key={'headers'} className="flex w-full underline items-center justify-between my-4">
              <div className="w-2/3">
                Address
              </div>
              <div className="w-1/3">
                Number of Items
              </div>
            </div>
            {data.map((item: any, index: number) => (
              <div key={index} className="flex w-full items-center justify-between my-2">
                <div className="w-3/5 truncate overflow-hidden">
                  {item.address}
                </div>
                <div className="w-1/3">
                  {item.amount}
                </div>
              </div>
            ))}
          </div>
        </Base>
      )}
    </>
  );
};

Whitelist.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Whitelist;
