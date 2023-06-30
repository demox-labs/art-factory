import { useState, useEffect, ChangeEvent } from 'react';
import useSWR from 'swr'
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button from '@/components/ui/button';
import {
  Deployment,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgram, NFTProgramId } from '@/aleo/nft-program';
import { TESTNET3_API_URL, getProgram } from '@/aleo/rpc';


const Deploy: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('programData', () => getProgram(NFTProgramId, TESTNET3_API_URL));

  let [program, _setProgram] = useState(NFTProgram);
  let [fee, setFee] = useState<string>('80');
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

    const aleoDeployment = new Deployment(
      publicKey,
      WalletAdapterNetwork.Testnet,
      program,
      Math.floor(parseFloat(fee) * 1_000_000),
    );

    const txId =
      (await (wallet?.adapter as LeoWalletAdapter).requestDeploy(
        aleoDeployment
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
        title="Deploy NFT Program"
        description="Deploy  NFT Program with the Leo Wallet"
      />
      <Base>
        {isLoading && <p>Loading...</p>}
        {!isLoading && data && 
          <div className="relative flex w-full flex-col rounded-full md:w-auto text-center p-8">
            {`${NFTProgramId}`} is already deployed <a target="_blank" rel="noopener noreferrer" className="underline mt-4" href={`https://explorer.hamp.app/program?id=${NFTProgramId}`}>View on Explorer</a>
          </div>}
        {!isLoading && !data &&
          <form
            noValidate
            role="search"
            onSubmit={handleSubmit}
            className="relative flex w-full flex-col rounded-full md:w-auto"
          >
            <label className="flex w-full items-center justify-between py-4">
              Program:
              <textarea
                className="w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter dark:text-gray-600 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                rows={12}
                value={program}
                disabled={true}
              />
            </label>

            <label className="flex w-full items-center justify-between py-4">
              Fee (in credits):
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
                  !program ||
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

Deploy.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Deploy;
