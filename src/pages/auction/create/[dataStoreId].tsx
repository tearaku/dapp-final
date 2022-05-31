import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house"
import { actions, programs } from "@metaplex/js";
import BN from 'bn.js';
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { SubmitHandler, useForm } from "react-hook-form";
import useNFTMetadataStore from "stores/useNFTMetadataStore";
import useSWR from "swr";
import { getAuctionHouseTradeState, getMetadata, getPriceWithMantissa } from "utils/auction-house";
import { notify } from "utils/notifications";
import { getTransactionWithRetryWithKeypair, sendSignedTransaction } from "utils/transaction";

const fetcher = (url) => fetch(url).then(res => res.json())

type FormData = {
  price: number
}

const AuctionCreate: NextPage = (props) => {
  const { connection } = useConnection()
  const wallet = useWallet()

  const route = useRouter()
  const dataStoreIdx = parseInt(route.query.dataStoreId as string)
  const metadata = useNFTMetadataStore((s) => s.metadata[dataStoreIdx])

  const { data, error } = useSWR(metadata.data.uri, fetcher)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    console.log("Form input data: ", data.price)

    const auctionHouseKey = new PublicKey(process.env.NEXT_PUBLIC_AUCTION_HOUSE_ID)
    const mintKey = new PublicKey(metadata.mint)
    const auctionHouseObj = await AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
      connection,
      new PublicKey(auctionHouseKey)
    )
    console.log("Treasury mint: ", auctionHouseObj.treasuryMint.toString())
    // Our auction house is set to not require sign offs!
    const buyPriceAdjusted = new BN(
      await getPriceWithMantissa(
        data.price,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        wallet.publicKey,
        connection,
      ),
    );
    console.log("Buy priced adjusted: ", buyPriceAdjusted)
    console.log("Buy priced adjusted: ", buyPriceAdjusted.toNumber())
    // Just selling 1 token
    const tokenSizeAdjusted = new BN(
      await getPriceWithMantissa(
        1,
        mintKey,
        wallet.publicKey,
        connection,
      ),
    );
    console.log("Token size adjusted: ", tokenSizeAdjusted)
    console.log("Token size adjusted: ", tokenSizeAdjusted.toNumber())
    const tokenAccountKey = (
      await AuctionHouseProgram.findAssociatedTokenAccountAddress(mintKey, wallet.publicKey)
    )[0]

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress()

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      auctionHouseKey,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintKey,
      tokenSizeAdjusted,
      buyPriceAdjusted,
    )

    const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
      auctionHouseKey,
      wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintKey,
      tokenSizeAdjusted,
      new BN(0),
    );

    const inTx = await AuctionHouseProgram.instructions.createSellInstruction({
      wallet: wallet.publicKey,
      tokenAccount: tokenAccountKey,
      metadata: await getMetadata(mintKey),
      //@ts-ignore
      authority: auctionHouseObj.authority,
      auctionHouse: auctionHouseKey,
      //@ts-ignore
      auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
      sellerTradeState: tradeState,
      freeSellerTradeState: freeTradeState,
      programAsSigner: programAsSigner,
    }, {
      tradeStateBump: tradeBump,
      freeTradeStateBump: freeTradeBump,
      programAsSignerBump: programAsSignerBump,
      buyerPrice: buyPriceAdjusted,
      tokenSize: tokenSizeAdjusted,
    })
    // Our auction house doesn't sign, so the seller has to sign the tx
    inTx.keys
      .filter(k => k.pubkey.equals(wallet.publicKey))
      .map(k => (k.isSigner = true))

    const transaction = await getTransactionWithRetryWithKeypair(connection, wallet.publicKey, [inTx], 'max')
    const signedTx = await wallet.signTransaction(transaction)
    const { txid, slot } = await sendSignedTransaction({
      connection,
      signedTransaction: signedTx,
      timeout: 300000
    });
    // const { signature, confirm } = await sendTransactionWithRetryWithKeypair(connection, [inTx], 'max')
    // const signature = await wallet.sendTransaction(transaction, connection)
    // const confirm = await connection.confirmTransaction(signature, 'confirmed')
    console.log(`1x of ${metadata.mint} is up for sale for ${data.price},
      from the auction house ${process.env.NEXT_PUBLIC_AUCTION_HOUSE_ID}`)
    console.log(`Transaction signature: ${txid}`)
    notify({ type: 'success', message: `Transaction successful!`, txid: txid })
    const res = await fetch("/api/listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mintPubkey: metadata.mint,
        sellerPubKey: wallet.publicKey,
        sellPrice: data.price
      })
    })
    if (res.ok) {
      console.log("DB listing updated!")
    } else {
      console.log("DB listing failed!")
    }
  }

  if (!metadata) return (<p>Loading data...</p>)
  if (!data) return <div>Loading NFT...</div>
  if (error) return <div>Error in loading NFT!</div>

  return (
    <div className="grid grid-cols-2">
      <Head>
        <title>Create Auction</title>
        <meta
          name="description"
          content="Basic Functionality"
        />
      </Head>
      <div className="card">
        <h1>Selling NFT</h1>
        <h2>{metadata.data.name}</h2>
        <img src={data.image} height="10%" />
        <form onSubmit={handleSubmit(onSubmit)}>
          <input className="text-black" type="number" min={0} step="any" {...register("price", { required: true })} />
          {errors.price && errors.price.type === "required" &&
            <p style={{ color: 'red' }}>Please pick a price! (set to 0 if free for the taking)</p>}
          <input type="submit" />
        </form>
      </div>
    </div>
  );
};

export default AuctionCreate;

/*
    const EPA = await actions.createExternalPriceAccount({
      connection: connection,
      wallet: wallet
    })
    console.log("External price account:\n", EPA)
    const vault = await actions.createVault({
      connection: connection,
      wallet: wallet,
      externalPriceAccount: EPA.externalPriceAccount,
      priceMint: EPA.priceMint
    })
    console.log("Vault created:\n", vault)
    const safetyDepositBoxs = await actions.addTokensToVault({
      connection: connection,
      wallet: wallet,
      vault: vault.vault,
      nfts: [{
        tokenMint: new PublicKey(metadata.mint),
        tokenAccount: nftTokenAccount.pubkey,
        amount: new BN(1)
      }]
    })
    console.log("Tokens added; Safety deposit boxes are:\n", safetyDepositBoxs)
    const vaultClosedTx = await actions.closeVault({
      connection: connection,
      wallet: wallet,
      vault: vault.vault,
      priceMint: EPA.priceMint,
    })
    console.log("Vault closed: ", vaultClosedTx)
    const auctionSetting = {
      instruction: 1,
      winners: new programs.auction.WinnerLimit({
        type: programs.auction.WinnerLimitType.Capped,
        usize: new BN(1),
      }),
      endAuctionAt: null,
      auctionGap: null,
      tokenMint: metadata.mint.toString(),
      priceFloor: new programs.auction.PriceFloor({
        minPrice: new BN(1),
        type: programs.auction.PriceFloorType.Minimum,
      }),
      tickSize: null,
      gapTickSizePercentage: null,
    }
    console.log("Auction settings:\n", auctionSetting)
    const auction = await actions.initAuction({
      connection: connection,
      wallet: wallet,
      vault: vault.vault,
      auctionSettings: auctionSetting,
    })
    console.log("Auction created: ", auction)
    console.log("Auction pubkey: ", auction.auction.toString())
    const auctionManagerPDA = await programs.metaplex.AuctionManager.getPDA(auction.auction)
    const manager = await programs.metaplex.AuctionManager.load(connection, auctionManagerPDA)
    console.log(manager)
    console.log(manager.data)
*/

// const nftTokenAccount = await connection.getTokenAccountsByOwner(
//   wallet.publicKey,
//   { mint: new PublicKey(metadata.mint) }
// ).then(data => { return data.value[0] })
// console.log("NFT token account:\n", nftTokenAccount)