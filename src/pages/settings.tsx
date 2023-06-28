import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import MintStatus from '@/components/ui/settings/mint-status';
import MintBlock from '@/components/ui/settings/mint-block';


const Settings: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Settings NFT Collection"
        description="Settings with the Leo Wallet"
      />
      <Base key="form">
        <MintStatus />
      </Base>
      <Base key="form">
        <MintBlock />
      </Base>
    </>
  );
};

Settings.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Settings;
