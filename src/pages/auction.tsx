import AuctionView from "components/AuctionView";
import type { NextPage } from "next";
import Head from "next/head";

const AuctionPage: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Auction Listing</title>
        <meta
          name="description"
          content="Basic Functionality"
        />
      </Head>
      <AuctionView />
    </div>
  );
};

export default AuctionPage;