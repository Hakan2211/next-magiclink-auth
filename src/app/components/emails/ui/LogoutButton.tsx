'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await fetch('/logout', {
      method: 'GET',
      credentials: 'include',
    });
    router.refresh();
  };
  return <button onClick={handleLogout}>Logout</button>;
}
