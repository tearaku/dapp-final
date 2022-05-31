import { Blockhash, Commitment, Connection, FeeCalculator, PublicKey, SimulatedTransactionResponse, Transaction, TransactionInstruction, TransactionSignature } from "@solana/web3.js"
import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house"
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from "bn.js"
import { useWallet, Wallet, WalletContext } from "@solana/wallet-adapter-react";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
)

/*
  Utility functions from the cli version
*/

export const getAuctionHouse = async (
  creator: PublicKey,
  treasuryMint: PublicKey,
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from(AuctionHouseProgram.PREFIX), creator.toBuffer(), treasuryMint.toBuffer()],
    AuctionHouseProgram.PUBKEY,
  );
};

export const getAuctionHouseFeeAcct = async (
  auctionHouse: PublicKey,
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(AuctionHouseProgram.PREFIX),
      auctionHouse.toBuffer(),
      Buffer.from(AuctionHouseProgram.FEE_PAYER),
    ],
    AuctionHouseProgram.PUBKEY,
  );
};

export const getAuctionHouseTreasuryAcct = async (
  auctionHouse: PublicKey,
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(AuctionHouseProgram.PREFIX),
      auctionHouse.toBuffer(),
      Buffer.from(AuctionHouseProgram.TREASURY),
    ],
    AuctionHouseProgram.PUBKEY,
  );
};

export const getAuctionHouseTradeState = async (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: BN,
  buyPrice: BN,
): Promise<[PublicKey, number]> => {
  console.log("Buy price buffer: ", buyPrice)
  console.log("Buy price buffer: ", buyPrice.toNumber())
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(AuctionHouseProgram.PREFIX),
      wallet.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      // buyPrice.toBuffer('le', 8),
      buyPrice.toArrayLike(Buffer, 'le', 8),
      // tokenSize.toBuffer('le', 8),
      tokenSize.toArrayLike(Buffer, 'le', 8)
    ],
    AuctionHouseProgram.PUBKEY,
  );
};

export const getPriceWithMantissa = async (
  price: number,
  mint: PublicKey,
  walletKeyPair: any,
  connection: Connection,
): Promise<number> => {
  const token = new Token(
    connection,
    mint,
    TOKEN_PROGRAM_ID,
    walletKeyPair,
  );
  const mintInfo = await token.getMintInfo();
  const mantissa = 10 ** mintInfo.decimals;
  return Math.ceil(price * mantissa);
};

export const getMetadata = async (
  mint: PublicKey,
): Promise<PublicKey> => {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};