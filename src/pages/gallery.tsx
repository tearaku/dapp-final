import type { NextPage } from "next";
import Head from "next/head";
import GalleryView from "views/gallery";

const Gallery: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Basic Functionality"
        />
      </Head>
      <GalleryView />
    </div>
  );
};

export default Gallery;
