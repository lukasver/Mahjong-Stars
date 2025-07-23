import { FadeAnimation } from '@mjs/ui/components/motion';

export default async function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FadeAnimation delay={0.1} duration={0.75}>
      {children}
    </FadeAnimation>
  );
}
