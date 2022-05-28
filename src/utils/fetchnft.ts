import { Connection, programs } from '@metaplex/js';

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
    const nftURIList = nftMetadata.map((item) => { return item.data.uri });
    return nftURIList;
  } catch {
    // TODO: notify to user via notify() ?
    console.log('Failed to load NFTs from wallet.');
  }
}