import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Metadata, MetadataProgram } from "@metaplex-foundation/mpl-token-metadata"
import { PublicKey } from "@solana/web3.js"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { actions, Connection, Wallet, programs } from '@metaplex/js'
import Link from 'next/link'

interface Prop {
  metadata: programs.metadata.MetadataData,
  dataStoreIdx: number
}

const fetcher = (url) => fetch(url).then(res => res.json())

export default function NFTDisplay({ metadata, dataStoreIdx }: Prop) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [tokenAccount, setTokenAccount] = useState(null)

  useEffect(() => {
    connection.getTokenAccountsByOwner(
      publicKey,
      { mint: new PublicKey(metadata.mint) }
    ).then(data => { setTokenAccount(data) })
  }, [metadata])

  useEffect(() => {
    console.log("NFT data: ", metadata);
    console.log("Token account: ", tokenAccount)
  }, [metadata, tokenAccount])

  const { data, error } = useSWR(metadata.data.uri, fetcher)
  const auctionListing = useSWR(`/api/listing/${metadata.mint}`, fetcher)

  if (!data || !auctionListing.data) return <div>Loading NFT...</div>
  if (error) return <div>Error in loading NFT!</div>

  return (
    <div className='card'>
      <img src={data.image} height="20%" />
      <h1>{data.name}</h1>
      <button className='btn'>
        {!auctionListing.data.data &&
          <Link href={`/auction/create/${dataStoreIdx}`}><a>Sell</a></Link>}
        {auctionListing.data.data &&
          <p>Already On Listing</p>}
      </button>
    </div>
  )
}