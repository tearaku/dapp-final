import create, { State } from 'zustand'
import { Connection, PublicKey } from '@solana/web3.js'
import { Wallet, programs } from '@metaplex/js';
import { getMetadata } from 'utils/fetchnft';

interface NFTMetadataStore extends State {
  metadata: programs.metadata.MetadataData[],
  getNFTMetadata: (user: PublicKey) => void
}

const useNFTMetadataStore = create<NFTMetadataStore>((set, _get) => ({
  metadata: [],
  tokenAccount: [],
  getNFTMetadata: async (user) => {
    getMetadata(user).then(metadataList => {
      set((s) => {
        s.metadata = metadataList
        console.log(`Metadata of NFTs owned fetched: ${s.metadata}`)
      })
    })
  }
}));

export default useNFTMetadataStore;