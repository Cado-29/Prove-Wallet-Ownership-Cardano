'use client';

import { CardanoWallet, useWallet } from '@meshsdk/react';
import { useState } from 'react';

export default function Home() {
  const { connected, wallet } = useWallet();
  const [token, setToken] = useState<string | null>(null);

  async function login() {
    if (!connected) return;

    const userAddress = (await wallet.getUsedAddresses())[0];

    const nonceRes = await fetch('/api/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ userAddress }),
    });
    const { nonce } = await nonceRes.json();

    const signature = await wallet.signData(nonce, userAddress);

    const verifyRes = await fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ userAddress, signature }),
    });

    const data = await verifyRes.json();
    if (data.token) {
      setToken(data.token);
      alert('Logged in with wallet!');
    } else {
      alert('Login failed.');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <CardanoWallet label="Connect Wallet" isDark={true} persist={true} />
      <button onClick={login} className="px-4 py-2 bg-blue-600 text-white rounded">
        Sign In With Cardano
      </button>
      {token && (
        <div className="mt-4 text-green-600">
          <p>JWT:</p>
          <code>{token}</code>
        </div>
      )}
    </div>
  );
}
