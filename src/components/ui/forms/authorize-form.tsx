import { useState, useEffect, ChangeEvent } from 'react';
import * as Aleo from '@demox-labs/aleo-sdk';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Button from '@/components/ui/button';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgram, NFTProgramId } from '@/aleo/nft-program';
import useSWR from 'swr';
import { TESTNET3_API_URL, getBaseURI, getJSON, getVerifyingKey } from '@/aleo/rpc';
import { joinBigIntsToString, removeVisibilitySuffix } from '@/lib/util';
import { set } from 'lodash';

const AUTHORIZE_FUNCTION = 'authorize';
const AuthorizeForm = () => {
  const { wallet, publicKey } = useWallet();
  const { data: verifyingKey, error, isLoading } = useSWR(`verifying-key-${AUTHORIZE_FUNCTION}`, () => getVerifyingKey(NFTProgramId, AUTHORIZE_FUNCTION));

  let [nfts, setNfts] = useState<any>();
  let [nftId, setNFTId] = useState<string | undefined>();
  let [transactionId, setTransactionId] = useState<string | undefined>();
  let [status, setStatus] = useState<string | undefined>();
  let [execution, setExecution] = useState<any | undefined>();

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

  const requestNFTs = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    const allRecords = await (wallet?.adapter as LeoWalletAdapter).requestRecords(NFTProgramId);
    const nftRecords = allRecords.filter((record: any) => record.data.edition && record.spent === false);
    if (nftRecords.length > 0) {
      const baseUri = await getBaseURI(TESTNET3_API_URL);
      for (let i = 0; i < nftRecords.length; i++) {
        let data = [
          BigInt(removeVisibilitySuffix(nftRecords[i].data.data.data1).slice(0, -4)),
          BigInt(removeVisibilitySuffix(nftRecords[i].data.data.data2).slice(0, -4))];

        const relativeUrl = joinBigIntsToString(data);
        const jsonUrl = 'https://' + baseUri + relativeUrl;
        const properties = await getJSON(jsonUrl);
        nftRecords[i].imageUrl = properties.image;
      }
    }
    setNfts(nftRecords);
  };

  const requestAuthorization = async () => {
    const aleoTransaction = Transaction.createTransaction(
      publicKey!,
      WalletAdapterNetwork.Testnet,
      NFTProgramId,
      AUTHORIZE_FUNCTION,
      [{ id: nftId}, '101u64'], // This should be a random number in production, generated on the back end of a DApp
      0,
    );

    const txId = await (wallet?.adapter as LeoWalletAdapter).requestExecution(aleoTransaction);
    setTransactionId(txId);
  };

  const verifyExecution = async () => {
    const pm = new Aleo.ProgramManager();
    const aleoVerifyingKey = Aleo.VerifyingKey.fromString(verifyingKey!);
    try {
      await pm.verify_execution(execution.execution, NFTProgram, AUTHORIZE_FUNCTION, true, undefined, aleoVerifyingKey);
      alert('Authorization successful!');
    } catch (e) {
      alert('Authorization failed :(');
      console.error(e);
    }
  }

  const getTransactionStatus = async (txId: string) => {
    const newStatus = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(txId);
    if (newStatus === 'Finalized' && !execution) {
      const execution = await (window as any).leoWallet.getExecution(
        transactionId
      );
      setExecution(execution);
    }
    setStatus(newStatus);
  };

  const resetAuthorization = () => {
    setExecution(undefined);
    setTransactionId(undefined);
    setStatus(undefined);
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create NFT Authorization
        </h2>
      </div>
      <div className="relative flex w-full flex-col rounded-full md:w-auto">
        {!nfts && (
          <div className="flex items-center justify-center py-8">
            <Button
              onClick={() => requestNFTs()}
              disabled={
                !publicKey
              }
              type="submit"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!publicKey ? 'Connect Your Wallet' : 'Request NFTs'}
            </Button>
          </div>
        )}
        {nfts && nfts.length > 0 && (
          <>
            <div className='text-center py-4'>
              <span>Select an NFT to Authorize</span>
            </div>
            <div className="flex items-center justify-center">
              {nfts.map((nft: any) => NFTComponent({ nft, setNFTId, resetAuthorization, nftId }))}
            </div>
          </>
        )}
        {nftId && !execution && (
          <div className="flex items-center justify-center py-8">
            <Button
              onClick={() => requestAuthorization()}
              disabled={
                !publicKey
              }
              type="submit"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!publicKey ? 'Connect Your Wallet' : 'Authorize DApp'}
            </Button>
          </div>
        )}
        {execution && (
          <div className="flex items-center justify-center py-8">
            <Button
              onClick={() => verifyExecution()}
              disabled={
                !publicKey
              }
              type="submit"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!publicKey ? 'Connect Your Wallet' : 'Verify Authorization'}
            </Button>
          </div>
        )}
      </div>

      {transactionId && !execution && (
        <div className='text-center py-4'>
          <span>Authorizing...</span>
        </div>
      )}
    </>
  );
};

const NFTComponent = ({ nft, setNFTId, resetAuthorization, nftId }: any) => {
  const selectedClass = nft.id === nftId ? `border-2 border-white` : '';
  return (
    <img onClick={() => { resetAuthorization(); setNFTId(nft.id); }} key={nft.id} src={nft.imageUrl} className={`p-4 w-1/5 rounded cursor-pointer ${selectedClass}`} />
  );
};


export default AuthorizeForm;