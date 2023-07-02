import { useState, ChangeEvent } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button from '@/components/ui/button';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import CSVUploader from '../csv-uploader';

const BulkWhitelist = () => {
  const { wallet, publicKey } = useWallet();

  let [fee, setFee] = useState<string>('1.504');
  let [minters, setMinters] = useState<{ address: string, total: number }[]>([]);
  let [transactionIds, setTransactionIds] = useState<string[] | undefined>();

  const handleSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    if (minters.length === 0) {
      throw new Error('No NFTs to add');
    }

    const inputs = minters.map(({ address, total }) => {
      return [address, `${total}u8`];
    });

    const aleoTransactions = inputs.map((input) => {
      return Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NFTProgramId,
        'add_minter',
        input,
        Math.floor(parseFloat(fee) * 1_000_000),
      );
    });

    const txIds =
      (await (wallet?.adapter as LeoWalletAdapter).requestBulkTransactions(
        aleoTransactions
      )) || '';
    setTransactionIds(txIds);
  };

  return (
    <>
    <form
      noValidate
      role="search"
      onSubmit={handleSubmit}
      className="relative flex w-full flex-col rounded-full md:w-auto"
    >
      <div className='text-center text-lg'>Upload Bulk Whitelist</div>
      <div className="flex w-full items-center justify-between pb-2 pt-8">
        File: 
        <div className='flex w-10/12'>
          <CSVUploader<{ address: string, total: number }>
            bulkAddData={(data) => {
              setMinters(data);
            }}
          />
        </div>
      </div>

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
          {!publicKey ? 'Connect Your Wallet' : 'Submit'}
        </Button>
      </div>
    </form>
    {transactionIds && (<div>Check wallet for upload status</div>)}
    </>
  );
};


export default BulkWhitelist;