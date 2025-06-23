import { checkSignature } from '@meshsdk/core';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  const { userAddress, signature } = await req.json();

  if (!userAddress || !signature) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('prove_ownership');
  const users = db.collection('users');

  // Find user with nonce
  const user = await users.findOne({ userAddress });
  if (!user || !user.nonce) {
    return NextResponse.json({ error: 'User not found or nonce missing' }, { status: 400 });
  }

  // Verify signature against nonce and userAddress
  const isValid = checkSignature(user.nonce, signature, userAddress);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Issue JWT token
  const token = jwt.sign({ userAddress }, JWT_SECRET, { expiresIn: '1h' });

  // Update user as verified & clear nonce (for security)
  await users.updateOne(
    { userAddress },
    { $set: { verified: true }, $unset: { nonce: "" } }
  );

  return NextResponse.json({ token });
}
