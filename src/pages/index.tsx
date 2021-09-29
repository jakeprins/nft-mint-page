import { Button, useToast } from '@apideck/components'
import { ethers } from 'ethers'
import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import myEpicNft from '../utils/MyEpicNFT.json'

const CONTRACT_ADDRESS = '0xe424f6E47365732bFBBbF38F529f45B308b80D30'

const IndexPage: NextPage = () => {
  const [currentAccount, setCurrentAccount] = useState('')
  const [isMinting, setIsMinting] = useState(false)
  const [etherScanLink, setEtherScanLink] = useState<undefined | string>()
  const [openSeaLink, setOpenSeaLink] = useState<undefined | string>()
  const [nftsLeft, setNftsLeft] = useState<undefined | string>()
  const [totalNfts, setTotalNfts] = useState<undefined | string>()
  const { addToast } = useToast()

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window as any

    if (!ethereum) {
      console.log('Make sure you have metamask!')
      return
    } else {
      console.log('We have the ethereum object', ethereum)
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' })

    if (accounts.length !== 0) {
      const account = accounts[0]
      console.log('Found an authorized account:', account)
      setCurrentAccount(account)
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener()
      setupNetworkListener()
    } else {
      console.log('No authorized account found')
    }
  }

  /*
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window as any

      if (!ethereum) {
        alert('Get MetaMask!')
        return
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log('Connected', accounts[0])
      setCurrentAccount(accounts[0])
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
      setupNetworkListener()
      // checkNetwork()
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window as any

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setOpenSeaLink(
            `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          )
        })

        console.log('Setup event listener!')
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window as any

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        console.log('Going to pop wallet now to pay gas...')
        const nftTxn = await connectedContract.makeAnEpicNFT()
        setIsMinting(true)
        addToast({
          title: 'Mining... please wait.',
          description: 'This could take a couple of minutes',
          autoClose: true
        })
        await nftTxn.wait()
        setIsMinting(false)
        setEtherScanLink(`https://rinkeby.etherscan.io/tx/${nftTxn.hash}`)
        addToast({
          title: 'NFT Minted!',
          description: nftTxn.hash,
          type: 'success',
          autoClose: false
        })
        setUpSupply()
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const setUpSupply = async () => {
    try {
      const { ethereum } = window as any

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        const nfts = await connectedContract.getTotalNFTsMintedSoFar()
        const currentNftsLeft = ethers.utils.formatUnits(nfts, 0)

        const total = await connectedContract.getTotalSupply()
        const totalNfts = ethers.utils.formatUnits(total, 0)

        setTotalNfts(totalNfts)
        setNftsLeft(currentNftsLeft)
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const setupNetworkListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window as any

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        provider.on('network', (newNetwork, oldNetwork) => {
          // When a Provider makes its initial connection, it emits a "network"
          // event with a null oldNetwork along with the newNetwork. So, if the
          // oldNetwork exists, it represents a changing network

          console.log('newNetwork', newNetwork)
          console.log('oldNetwork', oldNetwork)

          if (oldNetwork) {
            window.location.reload() as any
            return
          }
          if (newNetwork?.chainId !== 4) {
            addToast({
              title: 'Wrong Network!',
              description: 'Please switch to Rinkeby',
              type: 'warning'
            })
          }
        })
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  // const checkNetwork = async () => {
  //   try {
  //     const { ethereum } = window as any

  //     if (ethereum) {
  //       const provider = new ethers.providers.Web3Provider(ethereum)
  //       const { chainId } = await provider.getNetwork()
  //       console.log(chainId) // 42

  //       if (chainId !== 4) {
  //         addToast({
  //           title: 'Wrong Network!',
  //           description: 'Please switch to Rinkeby',
  //           type: 'warning',
  //           id: 1
  //         })
  //       }
  //     } else {
  //       console.log("Ethereum object doesn't exist!")
  //     }
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  useEffect(() => {
    checkIfWalletIsConnected()
    setUpSupply()
  }, [])

  /*
   * We added a simple onClick event here.
   */
  const renderNotConnectedContainer = () => (
    <Button onClick={connectWallet} className="mt-3 cta-B connect-wallet-button">
      Connect to Wallet
    </Button>
  )

  /*
   * We want the "Connect to Wallet" button to dissapear if they've already connected their wallet!
   */
  const renderMintUI = () => {
    if (etherScanLink) {
      return (
        <div>
          <a href={etherScanLink} target="_blank" rel="noopener noreferrer">
            <Button className="mt-3 mr-1 cta-button connect-wallet-button">See on etherscan</Button>
          </a>
          {openSeaLink && (
            <a href={openSeaLink} target="_blank" rel="noopener noreferrer">
              <Button className="mt-3 ml-1 cta-button connect-wallet-button">See on opensea</Button>
            </a>
          )}
        </div>
      )
    }
    return (
      <Button
        onClick={askContractToMintNft}
        className="mt-3 cta-button connect-wallet-button"
        isLoading={isMinting}
      >
        {isMinting ? 'Mining... please wait' : 'Mint NFT'}
      </Button>
    )
  }

  return (
    <Layout
      title="Mint page"
      favicon="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg"
    >
      <div className="absolute bottom-5 right-5">
        <div className="flex">
          <a
            href="https://testnets.opensea.io/collection/wordsnft-o8kb2n7sxb"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="" variant="outline">
              <img
                src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg"
                className="w-5 h-5 mr-2"
              />
              View on OpenSea
            </Button>
          </a>
          <a href="https://twitter.com/jakeprins_nl" target="_blank" rel="noopener noreferrer">
            <Button className="ml-4" variant="outline">
              <img
                src="https://static.cdnlogo.com/logos/t/96/twitter-icon.svg"
                className="w-5 h-5 mr-2"
              />
              @jakeprins_nl
            </Button>
          </a>
        </div>
      </div>
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div className="p-5 bg-white rounded-lg shadow-xl sm:max-w-md sm:w-full">
          <img
            src="data:image/png;base64,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"
            className="w-20 h-20 mx-auto -mt-10 rounded-full shadow-lg"
          />
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-xl font-semibold leading-6 text-gray-800">My NFT Collection</h3>
            <div className="mt-2">
              <p className="text-gray-500">Each unique. Each beautiful. Discover your NFT today.</p>
              {nftsLeft ? (
                <p className="mt-2 mb-1 font-medium">{`${
                  Number(totalNfts) - Number(nftsLeft)
                } / ${totalNfts} minted`}</p>
              ) : null}
              {currentAccount === '' ? renderNotConnectedContainer() : renderMintUI()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default IndexPage
