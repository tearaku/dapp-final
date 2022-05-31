import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata"
import { PublicKey, AccountMeta } from "@solana/web3.js"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { actions, Connection, Wallet, programs } from '@metaplex/js'
import Link from 'next/link'
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'
import BN from "bn.js"
import { getAuctionHouseBuyerEscrow, getAuctionHouseTradeState, getMetadata, getPriceWithMantissa } from 'utils/auction-house'
import useUserSOLBalanceStore from 'stores/useUserSOLBalanceStore'
import { NATIVE_MINT } from "@solana/spl-token";
import { getTransactionWithRetryWithKeypair, sendSignedTransaction } from 'utils/transaction'
import { notify } from 'utils/notifications'
import * as utilSchema from 'utils/schema'

interface Prop {
  mintPubkey: string
  sellerPubkey: string
  sellPrice: number
}

const fetcher = (url) => fetch(url).then(res => res.json())
const { metadata: { Metadata } } = programs


export default function NFTAuctionCard({ mintPubkey, sellerPubkey, sellPrice }: Prop) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [metadata, setMetadata] = useState<programs.metadata.MetadataData>(null)
  const [uri, setURI] = useState("")
  const balance = useUserSOLBalanceStore((s) => s.balance)

  const buyAction = async () => {
    const auctionHouseKey = new PublicKey(process.env.NEXT_PUBLIC_AUCTION_HOUSE_ID)
    const mintKey = new PublicKey(mintPubkey)
    const auctionHouseObj = await AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      new PublicKey(auctionHouseKey)
    )
    const buyPriceAdjusted = new BN(
      await getPriceWithMantissa(
        sellPrice,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        publicKey,
        connection,
      ),
    );
    const tokenSizeAdjusted = new BN(
      await getPriceWithMantissa(
        1,
        mintKey,
        publicKey,
        connection,
      ),
    );
    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      auctionHouseKey, publicKey,
    );

    const results =
      await connection.getTokenLargestAccounts(mintKey);
    // Purchase the token account with highest balance
    const tokenAccountKey: PublicKey = results.value[0].address;

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      auctionHouseKey,
      publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintKey,
      tokenSizeAdjusted,
      buyPriceAdjusted,
    );

    //@ts-ignore
    const ata = (
      await AuctionHouseProgram.findAssociatedTokenAccountAddress(
        auctionHouseObj.treasuryMint,
        publicKey,
      )
    )[0]

    const txIn = AuctionHouseProgram.instructions.createBuyInstruction({
      wallet: publicKey,
      paymentAccount: publicKey,
      transferAuthority: publicKey,
      metadata: await getMetadata(mintKey),
      tokenAccount: tokenAccountKey,
      escrowPaymentAccount,
      //@ts-ignore
      treasuryMint: auctionHouseObj.treasuryMint,
      //@ts-ignore
      authority: auctionHouseObj.authority,
      auctionHouse: auctionHouseKey,
      //@ts-ignore
      auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
      buyerTradeState: tradeState,
    }, {
      tradeStateBump: tradeBump,
      escrowPaymentBump: escrowBump,
      buyerPrice: buyPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    })
    const transaction = await getTransactionWithRetryWithKeypair(connection, publicKey, [txIn], 'max')
    const signedTx = await signTransaction(transaction)
    const { txid, slot } = await sendSignedTransaction({
      connection,
      signedTransaction: signedTx,
      timeout: 300000
    })
    notify({ type: 'success', message: `Make buy offer tx successful!`, txid: txid })
    console.log('Made offer for ', sellPrice)
  }

  const executeSaleAction = async () => {
    const auctionHouseKey = new PublicKey(process.env.NEXT_PUBLIC_AUCTION_HOUSE_ID)
    const mintKey = new PublicKey(mintPubkey)
    const sellerKey = new PublicKey(sellerPubkey)
    const auctionHouseObj = await AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      new PublicKey(auctionHouseKey)
    )
    // Walletkeypair and buyerpublickey is the same here --> buy does the execute_sale tx
    //@ts-ignore
    const buyPriceAdjusted = new BN(
      await getPriceWithMantissa(
        sellPrice,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        publicKey,
        connection,
      ),
    )
    const tokenSizeAdjusted = new BN(
      await getPriceWithMantissa(
        1,
        mintKey,
        publicKey,
        connection,
      ),
    )

    const tokenAccountKey = (await AuctionHouseProgram
      .findAssociatedTokenAccountAddress(mintKey, sellerKey))[0]

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        auctionHouseKey,
        publicKey,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        buyPriceAdjusted,
      )
    )[0];

    const sellerTradeState = (
      await getAuctionHouseTradeState(
        auctionHouseKey,
        sellerKey,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        buyPriceAdjusted,
      )
    )[0];

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        auctionHouseKey,
        sellerKey,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        new BN(0),
      );

    const [escrowPaymentAccount, bump] = await getAuctionHouseBuyerEscrow(
      auctionHouseKey,
      publicKey,
    );

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

    const _metadata = await getMetadata(mintKey);

    const metadataObj = await connection.getAccountInfo(_metadata);
    const metadataDecoded: utilSchema.Metadata = utilSchema.decodeMetadata(
      Buffer.from(metadataObj.data),
    );

    const remainingAccounts: AccountMeta[] = [];

    for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
      remainingAccounts.push({
        pubkey: new PublicKey(metadataDecoded.data.creators[i].address),
        isWritable: true,
        isSigner: false,
      });
    }
    //@ts-ignore
    const tMint: PublicKey = auctionHouseObj.treasuryMint;

    const txIn = AuctionHouseProgram.instructions.createExecuteSaleInstruction({
      buyer: publicKey,
      seller: sellerKey,
      tokenAccount: tokenAccountKey,
      tokenMint: mintKey,
      metadata: _metadata,
      treasuryMint: tMint,
      escrowPaymentAccount: escrowPaymentAccount,
      sellerPaymentReceiptAccount: sellerKey,
      // TODO
      buyerReceiptTokenAccount: (await AuctionHouseProgram
        .findAssociatedTokenAccountAddress(mintKey, publicKey))[0],
      authority: auctionHouseObj.authority,
      auctionHouse: auctionHouseKey,
      auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
      auctionHouseTreasury: auctionHouseObj.auctionHouseTreasury,
      buyerTradeState: buyerTradeState,
      sellerTradeState: sellerTradeState,
      freeTradeState: freeTradeState,
      programAsSigner: programAsSigner
    }, {
      escrowPaymentBump: bump,
      freeTradeStateBump: freeTradeStateBump,
      programAsSignerBump: programAsSignerBump,
      buyerPrice: buyPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    })
    // TODO: there are other params passed into this thing...
    // const instruction = await anchorProgram.instruction.executeSale(
    //   bump,
    //   freeTradeStateBump,
    //   programAsSignerBump,
    //   buyPriceAdjusted,
    //   tokenSizeAdjusted,
    //   {
    //     accounts: {},
    //     remainingAccounts,
    //     signers,
    //   },
    // );
    // end of TODO

    txIn.keys
      .filter(k => k.pubkey.equals(publicKey))
      .map(k => (k.isSigner = true));
    txIn.keys.push(...remainingAccounts);

    const transaction = await getTransactionWithRetryWithKeypair(connection, publicKey, [txIn], 'max');
    const signedTx = await signTransaction(transaction)
    const { txid, slot } = await sendSignedTransaction({
      connection,
      signedTransaction: signedTx,
      timeout: 300000
    })
    notify({ type: 'success', message: `Execute sale tx successful!`, txid: txid })
    console.log(`Accepted 1x ${mintPubkey} sale
      from wallet ${sellerPubkey} to ${publicKey.toString()}
      for ${sellPrice} SOL`);
  }

  const purchase = async () => {
    if (balance > sellPrice) {
      alert("There will be a series of tx to sign, please proceed as each one pops up!")
      await buyAction()
      await executeSaleAction()
      const res = await fetch(`/api/listing/${mintPubkey}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (res.ok) {
        console.log("All good on both tx & db!")
      }
    } else {
      alert("Insufficient fund!")
    }
  }

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
      <h3>Price: {sellPrice} SOL</h3>
      {(sellerPubkey == publicKey.toString()) &&
        <button className='btn'>Your own!</button>}
      {(sellerPubkey != publicKey.toString()) &&
        <button className='btn' onClick={purchase}>
          {(balance > sellPrice) &&
            <p>Buy</p>}
          {(balance <= sellPrice) &&
            <p>Insufficient Fund</p>}
        </button>}
    </div>
  )
}
