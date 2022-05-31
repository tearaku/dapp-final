import { Connection, programs } from '@metaplex/js';
import { useConnection } from '@solana/wallet-adapter-react';
import { notify } from './notifications';

export async function getMetadata(pubKey) {
  const { metadata: { Metadata } } = programs;
  // TODO: allow for switching of clusters
  const connection = new Connection('devnet')
  if (pubKey == "") {
    return;
  }
  try {
    const nftMetadata = await Metadata.findDataByOwner(connection, pubKey);
    console.log(nftMetadata);
    return nftMetadata;
  } catch {
    notify({ type: 'error', message: 'Failed to load NFTs from wallet.', description: 'Failed to load NFTs from wallet.' });
  }
}