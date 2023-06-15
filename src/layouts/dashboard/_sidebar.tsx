import cn from 'classnames';
import Logo from '@/components/ui/logo';
import { MenuItem } from '@/components/ui/collapsible-menu';
import Scrollbar from '@/components/ui/scrollbar';
import Button from '@/components/ui/button';
import routes from '@/config/routes';
import { useDrawer } from '@/components/drawer-views/context';
import { HomeIcon } from '@/components/icons/home';
import { Close } from '@/components/icons/close';
import { Sun } from '@/components/icons/sun';
import { FarmIcon } from '@/components/icons/farm';
import { OvenIcon } from '@/components/icons/oven';
import { Plus } from '@/components/icons/plus';
import { Verified } from '@/components/icons/verified';
import { Unlocked } from '@/components/icons/unlocked';

const menuItems = [
  {
    name: 'Getting Started',
    icon: <HomeIcon />,
    href: routes.admin,
  },
  {
    name: 'Deploy NFT Program',
    icon: <Sun />,
    href: routes.deploy,
  },
  {
    name: 'Initialize Collection',
    icon: <FarmIcon />,
    href: routes.initialize,
  },
  {
    name: 'Whitelist',
    icon: <Verified />,
    href: routes.whitelist,
  },
  {
    name: 'Add NFT',
    icon: <Plus />,
    href: routes.add,
  },
  {
    name: 'Settings',
    icon: <Unlocked />,
    href: routes.settings,
  },
];

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { closeDrawer } = useDrawer();
  return (
    <aside
      className={cn(
        'top-0 z-40 h-full w-full max-w-full border-gray-200 bg-body ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l dark:border-gray-700 dark:bg-dark xs:w-80 xl:fixed  xl:w-72 2xl:w-80',
        className
      )}
    >
      <div className="relative flex flex-col items-center justify-between px-6 py-4 2xl:px-8">
        <Logo />
        <div className="md:hidden">
          <Button
            title="Close"
            color="white"
            shape="circle"
            variant="transparent"
            size="small"
            onClick={closeDrawer}
          >
            <Close className="h-auto w-2.5" />
          </Button>
        </div>
      </div>

      <Scrollbar style={{ height: 'calc(100% - 96px)' }}>
        <div className="px-6 pb-5 2xl:px-8">
          <div className="mt-2">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                name={item.name}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      </Scrollbar>
    </aside>
  );
}
