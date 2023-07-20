import { useEffect, useState } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import { ImageSlider } from '@/components/ui/image-slider';
import useSWR from 'swr';
import { TESTNET3_API_URL, getClaimValue, getClaims, getHeight, getMintBlock, getNFTs, getSettingsStatus } from '@/aleo/rpc';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { NFTProgramId } from '@/aleo/nft-program';
import { getSettingsFromNumber } from '@/lib/util';
import MintCountdown from '@/components/mint/countdown';
import { random } from 'lodash';

type SectionProps = {
  title: string;
  bgColor: string;
  sectionWidth?: string;
};

export function Section({
  title,
  bgColor,
  children,
  sectionWidth,
}: React.PropsWithChildren<SectionProps>) {
  return (
    <div className="mb-3">
      <div className={`rounded-lg ${bgColor}`}>
        <div className="relative flex items-center justify-between gap-4 p-4">
          <div className={`items-center ltr:mr-6 rtl:ml-6 ${sectionWidth}`}>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-900 dark:text-white sm:text-sm">
                {title}
              </span>
              <span className="mt-1 hidden text-xs tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                {children}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const enum MintStep {
  CONNECT = 'CONNECT YOUR WALLET',
  STATUS = 'CHECK YOUR STATUS',
  OPENMINT = 'MINT AN NFT',
  MINT = 'MINT YOUR NFT',
  CLAIM = 'CLAIM YOUR NFT',
  WAIT = 'GET READY',
}

const DEFAULT_IMAGES = [
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/1.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/2.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/3.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/4.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/5.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/6.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/7.png',
  'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/privacy-pride/8.png'
]

const MintPage: NextPageWithLayout = () => {
  const { wallet, publicKey, requestRecords } = useWallet();
  const { data: settingsNum, error, isLoading } = useSWR('getSettingsStatus', () => getSettingsStatus(TESTNET3_API_URL));
  const { data: height, error: heightError, isLoading: heightIsLoading } = useSWR('height', () => getHeight(TESTNET3_API_URL));
  const { data: mintBlock, error: mintBlockError, isLoading: mintBlockIsLoading } = useSWR('getMintBlock', () => getMintBlock(TESTNET3_API_URL));

  let [settings, setSettings] = useState<any | undefined>(settingsNum ? getSettingsFromNumber(settingsNum!) : undefined);
  let [transactionId, setTransactionId] = useState<string | undefined>();
  let [nftImage, setNFTImage] = useState<string | undefined>();
  let [status, setStatus] = useState<string | undefined>();
  let [mintStep, setMintStep] = useState<MintStep>(MintStep.CONNECT);
  let [subMessage, setSubMessage] = useState<string>('');
  let [nftProgramRecords, setNftProgramRecords] = useState<any[]>([]);
  let [recordsRequested, setRecordsRequested] = useState<boolean>(false);

  useEffect(() => {
    setSettings(settingsNum ? getSettingsFromNumber(settingsNum!) : undefined);
  }, [settingsNum]);

  useEffect(() => {
    initialize();
  }, [settings, publicKey, nftProgramRecords]);

  const mintingActive = (settings: any, height: number | undefined, block: number | undefined) => {
    return settings?.active && height != undefined && block != undefined && block <= height;
  };

  const claimRecords = () => {
    return nftProgramRecords.filter((record) => record.data.claim != undefined);
  };

  const whitelistRecords = () => {
    return nftProgramRecords.filter((r) => r.data.amount != undefined);
  };

  const canWhitelistMint = () => {
    return whitelistRecords().length > 0 && whitelistRecords().some((r) => {
      const amountString = r.data.amount as string;
      const amount = parseInt(amountString.split('u8')[0]);
      return !r.spent && amount > 0;
    });
  }

  const initialize = async () => {
    if (!publicKey) {
      setMintStep(MintStep.CONNECT);
      return;
    }

    if (!mintingActive(settings, height, mintBlock?.block)) {
      setMintStep(MintStep.WAIT);
      setSubMessage('Minting is not active yet.');
      return;
    }

    if (nftProgramRecords.length === 0 && !recordsRequested) {
      const records = await requestRecords!(NFTProgramId);
      setNftProgramRecords(records);
      setRecordsRequested(true);
    }

    if (claimRecords().length > 0 && claimRecords().some((claim) => !claim.spent)) {
      setMintStep(MintStep.CLAIM);
      setSubMessage('You have privately minted, now claim your ZK NFT.')
      return;
    }

    if (!settings?.whiteList) {
      setMintStep(MintStep.OPENMINT);
      setSubMessage('Privately mint your ZK NFT!')
      return;
    }

    if (canWhitelistMint()) {
      setMintStep(MintStep.MINT);
      setSubMessage('You are on the list! Mint now.')
    } else {
      setMintStep(MintStep.WAIT);
      if (whitelistRecords().length > 0) {
        setSubMessage('You are on the list, but you have already minted.')
      } else {
        setSubMessage('You are not on list or.');
      }
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    setSettings(settingsNum ? getSettingsFromNumber(settingsNum!) : undefined);

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

  const handleButtonClick = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    let aleoTransaction: Transaction | null = null;

    if (mintStep === MintStep.OPENMINT) {
      const randomScalar = random(0, 100000000000) + 'scalar';
      aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NFTProgramId,
        'open_mint',
        [randomScalar],
        Math.floor(8_500_000),
      );
    }
    
    if (mintStep === MintStep.MINT) {
      const randomScalar = random(0, 100000000000) + 'scalar';
      const whitelistRecord = whitelistRecords().find(r => !r.spent);
      aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NFTProgramId,
        'mint',
        [whitelistRecord, randomScalar],
        Math.floor(7_000_000),
      );
    };

    if (mintStep === MintStep.CLAIM) {
      const claims = claimRecords();
      const unspentClaimRecord = claims.find(claim => !claim.spent);
      const claimData = unspentClaimRecord?.data.claim as string;
      // claim data should be a field.private value
      const claimKey = claimData.split('.')[0];
      const nftData = await getNFTs(TESTNET3_API_URL);
      const tokenEditionHash = (await getClaimValue(claimKey)).replaceAll("\"", "");
      const matchingNft = nftData.nfts.find((nft) => nft.tokenEditionHash === tokenEditionHash);
      if (!matchingNft) {
        setSubMessage('No NFT matching claim found.');
      } else {
        const tokenId = matchingNft.inputs[0].value;
        const edition = matchingNft.inputs[1].value;
        aleoTransaction = Transaction.createTransaction(
          publicKey,
          WalletAdapterNetwork.Testnet,
          NFTProgramId,
          'claim_nft',
          [unspentClaimRecord, tokenId, edition],
          Math.floor(4_250_000),
        );
      }
    }

    if (aleoTransaction) {
      const txId =
      (await (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      )) || '';
      setTransactionId(txId);
    }
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(txId);
    setStatus(status);
  };

  let timeToMint = 0;
  if (height && mintBlock) {
    timeToMint = (mintBlock.block - height) * 15_000; // 15 seconds per block
  }

  let sliderImages = DEFAULT_IMAGES;
  if (nftImage) {
    sliderImages = [nftImage];
  }

  return (
    <>
      <NextSeo
        title="Leo Wallet | Mint NFTs"
        description="Mint an NFT using the Leo Wallet"
      />
      <div className="mx-auto max-w-md px-4 mt-12 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-14 text-lg font-medium uppercase text-center tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl">
          JOIN THE PRIDE
        </h2>
        {timeToMint > 0 && (
          <div className='flex justify-center mb-6'>
            <MintCountdown date={Date.now() + timeToMint} />
          </div>
        )}
        <ImageSlider images={sliderImages} interval={5000} />
        {settingsNum !== undefined && (
          <div className='flex justify-center my-8'>
            <Button
              className="text-xl shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
              size='large'
              disabled={!settings?.active || !publicKey || mintStep === MintStep.WAIT}
              onClick={() => handleButtonClick()}
            >
                {mintStep}
            </Button>
          </div>
        )}
        {transactionId && (
          <div className='text-white text-center'>
            <div>{`Transaction status: ${status}`}</div>
          </div>
        )}
        {publicKey && !transactionId && (
          <div className='text-white text-center'>
            <div>{subMessage}</div>
          </div>
        )}
      </div>
    </>
  );
};

MintPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default MintPage;
