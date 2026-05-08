import { Suspense } from 'react';
import VerifyEmailClient from './PageClient';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  );
}
