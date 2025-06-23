import { generateNonce } from '@meshsdk/core';
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  const { userAddress } = await req.json();

  if (!userAddress) {
    return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
  }

  const nonce = generateNonce('Sign this message to login: ');

  const client = await clientPromise;
  const db = client.db('prove_ownership');
  const users = db.collection('users');

  // Upsert user: create or update nonce for this address
  await users.updateOne(
    { userAddress },
    { $set: { nonce, verified: false } },
    { upsert: true }
  );

  return NextResponse.json({ nonce });
}
