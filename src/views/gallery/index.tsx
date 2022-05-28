import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import NFTDisplay from "components/NFTDisplay";
import { useEffect, useState } from "react";
import { getMetadata } from "utils/fetchnft";

export default function GalleryView() {
  const { connection } = useConnection()
  // TODO: change this back to using wallet after minting NFTs on devnet for testing
  const { publicKey } = useWallet()
  // const publicKey = "4fJJwQPdSgMjDTc8iCZvq3yewNRNTER7D1K2daeArz5U"
  
  const [isLoading, setLoading] = useState(true)
  const [nftMetadata, setNftMetadata] = useState([])

  useEffect(() => {
    if (publicKey) {
      getMetadata(publicKey).then((data) => {
        setNftMetadata(data)
        setLoading(false)
      })
    }
  }, [publicKey, connection])

  if (!publicKey) return(<div><p>Please connect your wallet!</p></div>)
  if (isLoading) return(<div><p>Fetching NFTs...</p></div>)

  return (
    <div>
      <small>{nftMetadata.length} NFTs</small>
      <div className="grid grid-cols-5">
        {nftMetadata.map((uri) => {
          return <NFTDisplay uri={uri}/>
        })}
      </div>
    </div>
  )
}