import { actions } from "@metaplex/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react";
import { notify } from "utils/notifications";

export default function StoreSetup() {
  const [isConfigured, setIsConfigured] = useState(false)
  const wallet = useWallet();
  const { connection } = useConnection();

  const setupStore = async () => {
    if (!wallet.publicKey || !connection) {
      notify({ type: 'error', message: `Wallet not connected!` });
      return;
    }
    let res = await actions.initStore({
      connection: connection,
      wallet: wallet,
      isPublic: true,
    });
    notify({ type: 'success', message: `Store initialization successful! Store address is: ${res.storeId}` });
    console.log(`Store address: ${res.storeId}\nTxId: ${res.txId}`);
  }

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_STORE_ADDRESS) {
      setIsConfigured(true)
    }
  })

  return (
    <div>
      <button className="btn" onClick={setupStore} disabled={isConfigured}>
        Init Store
      </button>
    </div>
  )
}