import { useState, useEffect, ChangeEvent, useMemo } from 'react';
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
import debounce from 'lodash.debounce';


const Deploy: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  let [programName, setProgramName] = useState<string>(NFTProgramId.slice(0, NFTProgramId.indexOf('.aleo')));
  let [program, setProgram] = useState(NFTProgram);

  const { data, error, isLoading } = useSWR(programName, () => getProgram(programName + '.aleo', TESTNET3_API_URL));

  let [fee, setFee] = useState<string>('20');
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

  const debouncedUpdateProgramName = useMemo(() => debounce((newProgramName: string) => {
    setProgramName(newProgramName);
  }, 1000), []); // An empty dependency array means this function is created only once

  const handleSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    const aleoDeployment = new Deployment(
      publicKey,
      WalletAdapterNetwork.Testnet,
      program,
      Math.floor(parseFloat(fee) * 1_000_000),
      false,
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

  const getProgramNameInContract = () => {
    const match = program.match(/(?<=program\s+)(.*)(?=\.aleo;)/);
    return match ? match[0] : 'none';
  };

  const getControllingAddress = () => {
    const match = program.match(/(?<=assert.eq self.caller\s+)(.*)(?=;)/);
    return match ? match[0] : 'none';
  }

  const updateProgram = (oldText: string, newText: string) => {
    setProgram(program.replaceAll(oldText, newText));
  };

  const handleControllingAddressChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const assert = 'assert.eq self.caller ';
    const oldControllingAddress = assert + getControllingAddress();
    const newControllingAddress = assert + event.currentTarget.value;
    updateProgram(oldControllingAddress, newControllingAddress);
  };

  const handleProgramNameChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newProgramName = event.currentTarget.value ?? '';
    const oldProgramId = getProgramNameInContract() + '.aleo';
    const newProgramId = newProgramName + '.aleo';
    updateProgram(oldProgramId, newProgramId);
    debouncedUpdateProgramName(newProgramName);
  };

  return (
    <>
      <NextSeo
        title="Deploy NFT Program"
        description="Deploy  NFT Program with the Leo Wallet"
      />
        {!isLoading &&
          <div className="pt-8 text-sm xl:pt-10">
            <div className="mx-auto w-full rounded-lg bg-white p-5 pt-4 shadow-card dark:bg-light-dark xs:p-6 xs:pt-5">
              <div className="relative flex w-full flex-col rounded-full md:w-auto">
                <label className="flex w-full items-center justify-between py-4">
                  Program Name:
                  <textarea
                    className="w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter dark:text-gray-600 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                    rows={1}
                    value={getProgramNameInContract()}
                    onChange={handleProgramNameChange}
                  />
                </label>
                <label className="flex w-full items-center justify-between py-4">
                  Controlling Address:
                  <textarea
                    className="w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter dark:text-gray-600 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                    rows={1}
                    value={getControllingAddress()}
                    onChange={handleControllingAddressChange}
                  />
                </label>
              </div>
            </div>
          </div>
        }
      <Base>
        {data &&
          <>
            <div className="relative flex w-full flex-col rounded-full md:w-auto text-center p-8">
              {getProgramNameInContract()} is already deployed <a target="_blank" rel="noopener noreferrer" className="underline mt-4" href={`https://explorer.hamp.app/program?id=${getProgramNameInContract()}.aleo`}>View on Explorer</a>
            </div>
          </>
            }
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
