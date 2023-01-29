import styles from 'styles/Home.module.scss'
import ThemeToggleButton from 'components/Theme/ThemeToggleButton'
import ThemeToggleList from 'components/Theme/ThemeToggleList'
import { useState } from 'react'
import { useNetwork, useSwitchNetwork, useAccount, useBalance } from 'wagmi'
import ConnectWallet from 'components/Connect/ConnectWallet'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit'
import { useSignMessage } from 'wagmi'

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <Main />
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className={styles.header}>
      <div></div>
      <div className="flex items-center"></div>
      <div className="flex items-center">
        <ThemeToggleButton />
        <ConnectWallet />
      </div>
    </header>
  )
}

function Main() {
  const { address, isConnected, connector } = useAccount()
  const { chain, chains } = useNetwork()
  const { isLoading: isNetworkLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
  })

  return (
    <main className={styles.main}>
      <div className="text-center"></div>

      <div className="w-full max-w-xl rounded-xl bg-sky-500/10 p-5 text-center">
        <dl className={styles.dl}>
          <dt>Connector</dt>
          <dd>
            {connector?.name}
            {!address && (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <span onClick={openConnectModal} className="cursor-pointer hover:underline">
                    Not connected, connect wallet
                  </span>
                )}
              </ConnectButton.Custom>
            )}
          </dd>
          <dt>Connected Network</dt>
          <dd>{chain ? `${chain?.id}: ${chain?.name}` : 'n/a'}</dd>
          <dt>Switch Network</dt>
          <dd className="flex flex-wrap justify-center">
            {isConnected &&
              chains.map(x => (
                <button
                  disabled={!switchNetwork || x.id === chain?.id}
                  key={x.id}
                  onClick={() => switchNetwork?.(x.id)}
                  className={
                    (x.id === chain?.id ? 'bg-green-500' : 'bg-blue-500 hover:scale-105') +
                    ' m-1 rounded-lg py-1 px-3 text-white transition-all duration-150'
                  }
                >
                  {x.name}
                  {isNetworkLoading && pendingChainId === x.id && ' (switching)'}
                </button>
              ))}
            <ConnectWallet show="disconnected" />
          </dd>
          <dt>Account</dt>
          <dd className="break-all">{address ? `${address}` : 'n/a'}</dd>
          <dt>Balance</dt>
          <dd className="break-all">
            {isBalanceLoading ? 'loading' : balance ? `${balance?.formatted} ${balance?.symbol}` : 'n/a'}
          </dd>
          <dt>Sign Message</dt>
          <dd className="break-all">{address ? <SignMsg /> : 'n/a'} </dd>
        </dl>
      </div>
    </main>
  )
}

function SignMsg() {
  const [msg, setMsg] = useState('Dapp Starter')
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message: msg,
  })
  const signMsg = () => {
    if (msg) {
      signMessage()
    }
  }

  return (
    <>
      <p>
        <input value={msg} onChange={e => setMsg(e.target.value)} className="rounded-lg p-1" />
        <button
          disabled={isLoading}
          onClick={() => signMsg()}
          className="ml-1 rounded-lg bg-blue-500 py-1 px-2 text-white transition-all duration-150 hover:scale-105"
        >
          Sign
        </button>
      </p>
      <p>
        {isSuccess && <span>Signature: {data}</span>}
        {isError && <span>Error signing message</span>}
      </p>
    </>
  )
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div></div>
      <div className="flex items-center"></div>

      <div className="flex items-center"></div>
    </footer>
  )
}
