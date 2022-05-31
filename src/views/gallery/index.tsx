import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import NFTDisplay from "components/NFTDisplay";
import { useEffect, useState } from "react";
import useNFTMetadataStore from "stores/useNFTMetadataStore";

export default function GalleryView() {
  const { connection } = useConnection()
  // TODO: change this back to using wallet after minting NFTs on devnet for testing
  const { publicKey } = useWallet()
  // const publicKey = "4fJJwQPdSgMjDTc8iCZvq3yewNRNTER7D1K2daeArz5U"
  
  const [isLoading, setLoading] = useState(true)
  const nftMetadata = useNFTMetadataStore((s) => s.metadata)
  const { getNFTMetadata } = useNFTMetadataStore()

  useEffect(() => {
    if (publicKey) {
      getNFTMetadata(publicKey)
      setLoading(false)
    }
  }, [publicKey, connection, getNFTMetadata])

  if (!publicKey) return(<div><p>Please connect your wallet!</p></div>)
  if (isLoading) return(<div><p>Fetching NFTs...</p></div>)

  return (
    <div>
      <small>{nftMetadata.length} NFTs</small>
      <div className="grid grid-cols-5">
        {nftMetadata.map((metadata, index) => {
          console.log("NFTDisplay: ", metadata)
          return <NFTDisplay metadata={metadata} dataStoreIdx={index}/>
        })}
      </div>
    </div>
  )
}