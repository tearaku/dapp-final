import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata"
import { PublicKey } from "@solana/web3.js"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { actions, Connection, Wallet, programs } from '@metaplex/js'
import Link from 'next/link'

interface Prop {
  mintPubkey: string
}

const fetcher = (url) => fetch(url).then(res => res.json())
const { metadata: { Metadata } } = programs

export default function NFTAuctionCard({ mintPubkey }: Prop) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [metadata, setMetadata] = useState<programs.metadata.MetadataData>(null)
  const [uri, setURI] = useState("")

  useEffect(() => {
    if (mintPubkey) {
      Metadata.findByMint(connection, new PublicKey(mintPubkey)).then(data => {
        setMetadata(data.data)
        setURI(data.data.data.uri)
        setIsLoadingMetadata(false)
      })
    }
  }, [mintPubkey])

  const { data, error } = useSWR(uri, fetcher)
  
  useEffect(() => {
    console.log("Data fetcehd by swr: ", data)
  }, [data])

  if (!data) return <div>Loading NFT...</div>

  return (
    <div className='card'>
      <img src={data.image} height="20%" />
      <h1>{data.name}</h1>
      <button className='btn'>
        <Link href={``}><a>Buy</a></Link>
      </button>
    </div>
  )
}