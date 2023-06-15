import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
import { useMemo, useState } from 'react';
import Head from 'next/head';
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ThemeProvider } from 'next-themes';

// base css file
import 'swiper/css';
import '@/assets/css/scrollbar.css';
import '@/assets/css/globals.css';
import '@/assets/css/range-slider.css';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'Leo NFT',
      }),
    ],
    []
  );
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => page);
  return (
    <>
      <Head>
        {/* maximum-scale 1 meta tag need to prevent ios input focus auto zooming */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 maximum-scale=1"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <WalletProvider
            wallets={wallets}
            decryptPermission={DecryptPermission.UponRequest}
          >
            <WalletModalProvider>
              <ThemeProvider
                attribute="class"
                enableSystem={false}
                defaultTheme="dark"
              >
                {getLayout(<Component {...pageProps} />)}
              </ThemeProvider>
            </WalletModalProvider>
          </WalletProvider>
        </Hydrate>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </>
  );
}

export default CustomApp;
