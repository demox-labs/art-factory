import cn from 'classnames';
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentProps,
} from 'overlayscrollbars-react';
import 'overlayscrollbars/css/OverlayScrollbars.css';

interface ScrollbarProps extends OverlayScrollbarsComponentProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function Scrollbar({
  options,
  style,
  className,
  ...props
}: React.PropsWithChildren<ScrollbarProps>) {
  return (
    <OverlayScrollbarsComponent
      options={{
        className: cn('os-theme-thin', className),
        scrollbars: {
          autoHide: 'scroll',
        },
        ...options,
      }}
      style={style}
      {...props}
    />
  );
}
