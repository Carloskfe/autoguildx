import { Suspense } from 'react';
import ResetPasswordClient from './PageClient';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
