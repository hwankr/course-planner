// Footer — props adapted from src/components/ui/Footer.tsx and src/components/ui/CopyEmail.tsx. Documentation only; not type-checked.

import type * as React from 'react';

/** Footer takes no props: every column, link, route and the contact address is hardcoded in the component. */
export interface FooterProps {}

/** Props of the click-to-copy contact line rendered inside the brand column (a part of Footer). */
export interface CopyEmailProps {
  /** Address written to the clipboard on click and shown as `Contact : {email}`; the footer passes 'fabronjeon@gmail.com'. */
  email: string;
}

/** Server component; RootLayout renders it once after the page wrapper, and `mt-auto` pins it to the bottom of short pages. */
export declare function Footer(): React.JSX.Element;

/** Client component ('use client'); keeps a local `copied` boolean for 2000 ms after a click and shows 복사됨! while it is true. */
export declare function CopyEmail(props: CopyEmailProps): React.JSX.Element;
