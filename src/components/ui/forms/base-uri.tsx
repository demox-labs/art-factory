import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { ChangeEvent, useEffect, useState } from "react";
import Button from "../button";
import useSWR from "swr";
import { TESTNET3_API_URL, getBaseURI } from "@/aleo/rpc";
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from "@demox-labs/aleo-wallet-adapter-base";
import { NFTProgramId } from "@/aleo/nft-program";
import { padArray, splitStringToBigInts } from "@/lib/util";

const BaseURI = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('getBaseURI', () => getBaseURI(TESTNET3_API_URL));

  let [uri, setURI] = useState<string>(data ?? '');
  let [fee, setFee] = useState<string>('5');
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

    if (!data) throw new Error('Collection not initialized.');

    const uriInputs = padArray(splitStringToBigInts(uri), 4);
    const formattedUriInput = `{ data0: ${uriInputs[0]}u128, data1: ${uriInputs[1]}u128, data2: ${uriInputs[2]}u128, data3: ${uriInputs[3]}u128 }`;

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NFTProgramId,
      'update_base_uri',
      [formattedUriInput],
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
          URI: { data ?? 'not set'}
        </h2>
      </div>
      <form
        noValidate
        role="search"
        onSubmit={handleSubmit}
        className="relative flex w-full flex-col rounded-full md:w-auto"
      >
        <label className="flex w-full items-center justify-between py-4">
          Base URI for NFTs:
          <input
            className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="aleo-public.s3.us-west-2.amazonaws.com/"
            onChange={(event) =>
              setURI(event.currentTarget.value)
            }
            value={uri}
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
            {!publicKey ? 'Connect Your Wallet' : 'Update Base URI'}
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

export default BaseURI;