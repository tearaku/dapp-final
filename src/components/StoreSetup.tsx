import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house"
import { NATIVE_MINT } from "@solana/spl-token";
import { useEffect, useState } from "react";
import { notify } from "utils/notifications";
import * as web3 from "@solana/web3.js"
import { getAuctionHouse, getAuctionHouseFeeAcct, getAuctionHouseTreasuryAcct } from "utils/auction-house";

export default function StoreSetup() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [storeObj, setStoreObj] = useState(null)
  const [storeFeeBal, setStoreFeeBal] = useState(0)
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const setupStore = async () => {
    if (!publicKey || !connection) {
      notify({ type: 'error', message: `Wallet not connected!` });
      return;
    }
    const sfbp = 100
    let twdKey: web3.PublicKey = publicKey
    let fwdKey: web3.PublicKey = publicKey
    let tMintKey: web3.PublicKey = NATIVE_MINT
    const twdAta = twdKey
    const [auctionHouse, bump] = await getAuctionHouse(publicKey, tMintKey)
    const [feeAccount, feeBump] = await getAuctionHouseFeeAcct(auctionHouse)
    const [treasuryAccount, treasuryBump] = await getAuctionHouseTreasuryAcct(auctionHouse)
    const txIn = AuctionHouseProgram.instructions.createCreateAuctionHouseInstruction({
      treasuryMint: tMintKey,
      payer: publicKey,
      authority: publicKey,
      feeWithdrawalDestination: fwdKey,
      treasuryWithdrawalDestination: twdAta,
      treasuryWithdrawalDestinationOwner: twdKey,
      auctionHouse: auctionHouse,
      auctionHouseFeeAccount: feeAccount,
      auctionHouseTreasury: treasuryAccount,
    }, {
      bump: bump,
      feePayerBump: feeBump,
      treasuryBump: treasuryBump,
      sellerFeeBasisPoints: sfbp,
      requiresSignOff: false,
      canChangeSalePrice: true,
    })
    console.log("Ready to send transaction...")
    const transaction = new web3.Transaction().add(txIn)
    const signature = await sendTransaction(transaction, connection)
    const res = await connection.confirmTransaction(signature, 'confirmed')
    notify({ type: 'success', message: `Transaction successful! Auction house pubkey: ${auctionHouse.toString()}`, txid: signature })
    console.log(`Auction house pubkey: ${auctionHouse.toString()}`)
  }

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUCTION_HOUSE_ID) {
      setIsConfigured(true)
      AuctionHouseProgram.accounts.AuctionHouse.fromAccountAddress(
        connection,
        new web3.PublicKey(process.env.NEXT_PUBLIC_AUCTION_HOUSE_ID)
      ).then(auctionHouse => {
        setStoreObj(auctionHouse)
        connection.getBalance(auctionHouse.auctionHouseFeeAccount).then(bal => {
          setStoreFeeBal(bal / web3.LAMPORTS_PER_SOL)
        })
      })
      console.log(storeObj)
    }
  }, [])

  return (
    <div className="card border-2">
      {storeObj &&
        <div>
          <p>Seller fee basis points: {storeObj.sellerFeeBasisPoints}</p>
          <p>Fee account: {storeObj.auctionHouseFeeAccount.toString()}</p>
          <p>Fee account balance: {storeFeeBal}</p>
          <p>Requires sign off: {storeObj.requiresSignOff ? "Yes": "No"}</p>
        </div>}
      <button className="btn" onClick={setupStore} disabled={isConfigured}>
        Init Store
      </button>
    </div>
  )
}