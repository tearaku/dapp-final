import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Metadata, MetadataProgram } from "@metaplex-foundation/mpl-token-metadata"
import { PublicKey } from "@solana/web3.js"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { actions, Connection, Wallet, programs } from '@metaplex/js'
import Link from 'next/link'
import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house"
import NFTAuctionCard from './NFTAuctionCard'

const fetcher = (url) => fetch(url).then(res => res.json())

export default function AuctionView() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const { data, error } = useSWR(`/api/listing`, fetcher)

  useEffect(() => {
    console.log("Auction house program ID?: ", AuctionHouseProgram.PUBKEY.toString())
  }, [])

  useEffect(() => {
    console.log(data)
  }, data)

  if (error) return (<h1>Error in fetching all listings! Please try to wait a bit while SWR refetches data...</h1>)
  if (!data) return (<h1>Loading all listings...</h1>)

  return (
    <div className='grid grid-cols-4'>
      {data.data.map((value, index) => {
        return <NFTAuctionCard mintPubkey={value.mintPubkey} />
      })}
    </div>
  )
}