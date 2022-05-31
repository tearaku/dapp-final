import { Prisma, Listing } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from "utils/prisma"

type Data = {
  data?: Listing
  msg: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const mint = req.query.mintPubkey as string

  if (req.method == "GET") {
    const listing = await prisma.listing.findUnique({
      where: {
        mintPubkey: mint
      }
    })
    if (!listing) {
      res.status(500).json({msg: "Listing not found."})
      return
    }

    res.status(200).json({
      msg: "Listing found!",
      data: listing
    })
    return
  }

  // Requires public key of wallet
  if (req.method == "DELETE") {
    const confirm = await prisma.listing.findUnique({
      where: {
        mintPubkey: mint
      }
    })
    if (!confirm) {
      res.status(400).json({msg: "The given mint is not on listing right now."})
      return
    }

    const listing = await prisma.listing.delete({
      where: {
        mintPubkey: mint
      }
    })
    res.status(200).json({
      msg: "Listing delete successful.",
      data: listing
    })
    return
  }

  res.status(400).json({ msg: "Method not allowed." })
}