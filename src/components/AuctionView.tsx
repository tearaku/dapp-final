import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Metadata, MetadataProgram } from "@metaplex-foundation/mpl-token-metadata"
import { PublicKey } from "@solana/web3.js"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { actions, Connection, Wallet, programs } from '@metaplex/js'
import Link from 'next/link'
import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house"

const fetcher = (url) => fetch(url).then(res => res.json())

const fetchAuctions = async (connection) => {
  const storePDA = await programs.metaplex.Store.getPDA(new PublicKey(process.env.NEXT_PUBLIC_STORE_ADDRESS))
  const auctionManagers = await programs.metaplex.AuctionManager.findMany(connection, {
    store: storePDA,
  });
  const auctions = await Promise.all(
    auctionManagers.map((m) => m.getAuction(connection))
  );
  console.log("Auctions: ", auctions)
}

export default function AuctionView() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  useEffect(() => {
    console.log("Auction house program ID?: ", AuctionHouseProgram.PUBKEY.toString())
    fetchAuctions(connection)
  }, [])

  return (
    <div className='card'>

    </div>
  )
}