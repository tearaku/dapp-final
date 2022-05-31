import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from "utils/prisma"
import { Listing } from "@prisma/client"

type Data = {
  data?: Listing[]
  msg: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method == "GET") {
    const allListing = await prisma.listing.findMany()
    res.status(200).json({
      msg: "All listings present in the store.",
      data: allListing
    })
    return
  }

  if (req.method == "POST") {
    const { mintPubkey, sellerPubkey, sellPrice} = req.body
    const ifExist = await prisma.listing.findUnique({
      where: {mintPubkey: mintPubkey}
    })
    if (ifExist) {
      res.status(500).json({msg: "You can't list an already listed item!"})
      return
    }

    const newListing = await prisma.listing.create({
      data: {
        mintPubkey: mintPubkey,
        sellerPubkey: sellerPubkey,
        sellPrice: parseFloat(sellPrice as string),
      }
    })
    res.status(200).json({msg: "Listing success."})
    return
  }

  res.status(400).json({ msg: "Method not allowed." })
}