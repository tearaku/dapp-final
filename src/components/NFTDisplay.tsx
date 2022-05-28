import Image from 'next/image'
import useSWR from 'swr'

type PropType = {
  uri: string
}

const fetcher = (url) => fetch(url).then(res => res.json())

export default function NFTDisplay({ uri }: PropType) {
  const {data, error} = useSWR(uri, fetcher)

  if (!data) return <div>Loading NFT...</div>
  if (error) return <div>Error in loading NFT!</div>

  return (
    <div className='card'>
      {console.log(data.image)}
      <img src={data.image} height="20%" />
      <h1>{data.name}</h1>
    </div>
  )
}