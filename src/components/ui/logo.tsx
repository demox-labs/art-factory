import Image from '@/components/ui/image';
import AnchorLink from '@/components/ui/links/anchor-link';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import lightLogo from '@/assets/images/logo.svg';
import darkLogo from '@/assets/images/logo-white.svg';
import logo from '@/assets/images/icon-128.png';

const Logo: React.FC<React.SVGAttributes<{}>> = (props) => {
  const isMounted = useIsMounted();
  const { isDarkMode } = useIsDarkMode();

  return (
    <AnchorLink
      href="https://leo.app"
      className="flex w-28 outline-none sm:w-32 4xl:w-36"
      {...props}
    >
      <span className="relative flex overflow-hidden">
        {isMounted && isDarkMode && (
          <Image src={logo} alt="Leo Wallet" priority />
        )}
        {isMounted && !isDarkMode && (
          <Image src={logo} alt="Leo Wallet" priority />
        )}
      </span>
    </AnchorLink>
  );
};

export default Logo;
