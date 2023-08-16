import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import AuthorizeForm from '@/components/ui/forms/authorize-form';


const Authorize: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Settings NFT Collection"
        description="Settings with the Leo Wallet"
      />
      <Base key="authorize-form">
        <AuthorizeForm />
      </Base>
    </>
  );
};

Authorize.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Authorize;
