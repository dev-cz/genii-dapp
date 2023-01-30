import styles from 'styles/Home.module.scss'
import ThemeToggleButton from 'components/Theme/ThemeToggleButton'
import { useState } from 'react'
import { useNetwork, useSwitchNetwork, useAccount, useBalance, useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction, erc20ABI } from 'wagmi'
import ConnectWallet from 'components/Connect/ConnectWallet'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import GeniiStakingABI from '../contracts/geniiStakingABI.json'
import { ethers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils.js'

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
      <div className="flex w-1/3 justify-start">
        <a href="https://nahmii.io/" target="_blank" rel="noopener noreferrer">
          <img src="/genii-icon.png" alt="wordlogo" width={80} height={30} />
        </a>
      </div>
      <div className="flex items-center"></div>
      <div className="flex items-center">
        <div className='px-2'>
        <ThemeToggleButton />
        </div>
        <ConnectWallet />
      </div>
    </header>
  )
}

function Main() {
  let GeniiContract = '0x87Db20d78BA4d80cd99357B05BB8c75eC87836Fd';
  let GeniiStakingContract = '0x48b514bF2ae5f23Ba60454302721E3534ae03e86';

  const { address, isConnected, connector } = useAccount()
  const { chain, chains } = useNetwork()
  const { isLoading: isNetworkLoading, pendingChainId, switchNetwork } = useSwitchNetwork()

  const [geniiToStake, setGeniiToStake] = useState(0)

  const [geniiToUnStake, setGeniiToUnStake] = useState(0)

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
  })

  const { data: GeniiTokenBalance, isLoading: isGeniiTokenBalanceLoading, refetch: GeniiTokenBalanceRefetch } = useBalance({
    address: address,
    token: '0x87Db20d78BA4d80cd99357B05BB8c75eC87836Fd',
  })

  const { data: GeniiStakedBalance, isError: GeniiStakedBalanceError, isLoading: GeniiStakedBalanceLoading, refetch: GeniiStakedBalanceRefetch } = useContractRead({
    address: GeniiStakingContract,
    abi: GeniiStakingABI,
    functionName: 'balanceOf',
    args: [address],
  })

  const { data: GeniiRewardsEarned, isError: GeniiRewardsEarnedError, isLoading: GeniiRewardsEarnedLoading } = useContractRead({
    address: GeniiStakingContract,
    abi: GeniiStakingABI,
    functionName: 'earned',
    args: [address],
  })

  const { data: GeniiRewards, isError: GeniiRewardsError, isLoading: GeniiRewardsLoading } = useContractRead({
    address: GeniiStakingContract,
    abi: GeniiStakingABI,
    functionName: 'rewards',
    args: [address],
  })

  const [approvalComplete, setApprovalComplete] = useState(false)

  const { config: approveStakeToken, error: approveStakeTokenError } = usePrepareContractWrite({
    address: GeniiContract,
    abi: erc20ABI,
    enabled: GeniiTokenBalance?.value.toString() > '0',
    functionName: 'approve',
    args: ['0x48b514bF2ae5f23Ba60454302721E3534ae03e86', parseUnits(geniiToStake?.toString(), 15)],
  })

  const {
    data: approveStakeTokenData,
    isLoading: approveStakeTokenLoading,
    isSuccess: approveStakeTokenSuccess,
    write: approveSwapTokenWrite,
  } = useContractWrite(approveStakeToken)

  const stakeAllowance = useContractRead({
    address: GeniiContract,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address, '0x48b514bF2ae5f23Ba60454302721E3534ae03e86'],
    watch: true,
    onSuccess(data) {
      if (GeniiTokenBalance?.value?.toString() > '0' && stakeAllowance.data?.toString() >= GeniiTokenBalance?.value?.toString()) {
        setApprovalComplete(true)
      }
    },
  })

  const approveStakeTokenWaitForTransaction = useWaitForTransaction({
    hash: approveStakeTokenData?.hash,
    onSuccess(approveSwapTokenData) {
      console.log('Success', approveSwapTokenData)
    },
    onSettled(approveSwapTokenData) {
      setApprovalComplete(true)
    },
  })

  const { config: stakeToken, error: stakeTokenError } = usePrepareContractWrite({
    address: GeniiStakingContract,
    abi: GeniiStakingABI,
    enabled: approvalComplete,
    functionName: 'stake',
    args: [parseUnits(geniiToStake?.toString(), 15)]
  })

  const {
    data: stakeTokenData,
    isLoading: stakeTokenLoading,
    isSuccess: stakeTokenSuccess,
    write: stakeTokenWrite,
  } = useContractWrite(stakeToken)

  const stakeTokenWaitForTransaction = useWaitForTransaction({
    hash: stakeTokenData?.hash,
    onSuccess(stakeTokenData) {
      console.log('Success', stakeTokenData)
      GeniiTokenBalanceRefetch()
      GeniiStakedBalanceRefetch()
    },
  })

  const { config: claimStakedRewards, error: claimStakedRewardsError } = usePrepareContractWrite({
    address: GeniiStakingContract,
    abi: GeniiStakingABI,
    enabled: GeniiRewardsEarned?.toString() > '0',
    functionName: 'getReward',
  })

  const {
    data: claimStakedRewardsData,
    isLoading: claimStakedRewardsLoading,
    isSuccess: claimStakedRewardsSuccess,
    write: claimStakedRewardsWrite,
  } = useContractWrite(claimStakedRewards)

  const claimStakedRewardsWaitForTransaction = useWaitForTransaction({
    hash: claimStakedRewardsData?.hash,
    onSuccess(claimStakedRewardsData) {
      console.log('Success', claimStakedRewardsData)
    },
  })

  const { config: exitStakedToken, error: exitStakedTokenError } = usePrepareContractWrite({
    address: GeniiStakingContract,
    abi: GeniiStakingABI,
    enabled: GeniiStakedBalance?.toString() > '0',
    functionName: 'exit',
  })

  const {
    data: exitStakedTokenData,
    isLoading: exitStakedTokenLoading,
    isSuccess: exitStakedTokenSuccess,
    write: exitStakedTokenWrite,
  } = useContractWrite(exitStakedToken)

  const exitStakedTokenWaitForTransaction = useWaitForTransaction({
    hash: exitStakedTokenData?.hash,
    onSuccess(exitStakedTokenData) {
      console.log('Success', exitStakedTokenData)
      GeniiTokenBalanceRefetch()
      GeniiStakedBalanceRefetch()
    },
  })

  const { config: withdrawStakedToken, error: withdrawStakedTokenError } = usePrepareContractWrite({
    address: GeniiStakingContract,
    abi: GeniiStakingABI,
    enabled: geniiToUnStake?.toString() > '0',
    functionName: 'withdraw',
    args: [parseUnits(geniiToUnStake?.toString(), 15)]
  })

  const {
    data: withdrawStakedTokenData,
    isLoading: withdrawStakedTokenLoading,
    isSuccess: withdrawStakedTokenSuccess,
    write: withdrawStakedTokenWrite,
  } = useContractWrite(withdrawStakedToken)

  const withdrawStakedTokenWaitForTransaction = useWaitForTransaction({
    hash: withdrawStakedTokenData?.hash,
    onSuccess(withdrawStakedTokenData) {
      console.log('Success', withdrawStakedTokenData)
      GeniiTokenBalanceRefetch()
      GeniiStakedBalanceRefetch()
    },
  })

  return (
    <main className={styles.main}>
      <div className="w-full max-w-xl rounded-xl bg-white/100 dark:bg-[#15181f]/100 p-5 text-center text-[#495264] dark:text-white">
        <div className="text-center font-bold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#ff44c9] to-[#00b8fa]">Genii Staking</div>
        {isConnected ?
        <dl className={styles.dl}>
          <div className='flex justify-center'>
            <div className='flex w-fit justify-between'>
              <div className='px-2'>
                <dt>GENII Wallet Balance</dt>
                <dd>
                  {isGeniiTokenBalanceLoading ? 'loading' : GeniiTokenBalance ? `${GeniiTokenBalance?.formatted} ${GeniiTokenBalance?.symbol}` : 'n/a'}
                </dd>
              </div>
              <div className='px-2'>
                <dt>Staked GENII</dt>
                <dd>
                  {GeniiStakedBalanceLoading ? 'loading' : GeniiStakedBalance ? `${formatUnits(GeniiStakedBalance?.toString(), 15)} ${GeniiTokenBalance?.symbol}` : 'n/a'}
                </dd>
              </div>
            </div>
          </div>
          <dt>Rewards</dt>
            <dd className="break-all">
              <div>
                Total Earned: {GeniiRewardsLoading ? 'loading' : GeniiRewards ? formatUnits(GeniiRewards?.toString(), 15)+' NII' : 'n/a'}
              </div>
              <div>
                Claimable: {GeniiRewardsEarnedLoading ? 'loading' : GeniiRewardsEarned ? formatUnits(GeniiRewardsEarned?.toString(), 15)+' NII' : 'n/a'}
              </div>
              <div className="p-1">
                <button
                  hidden={GeniiRewardsEarned?.toString() <= '0'}
                  className="min-w-[8rem] rounded-md enabled:bg-gradient-to-r from-[#ff44c9] to-[#00b8fa] p-1.5 text-center text-sm text-white enabled:hover:scale-105 disabled:bg-gray-500"
                  onClick={() => claimStakedRewardsWrite?.()}
                >
                  {claimStakedRewardsLoading || claimStakedRewardsWaitForTransaction.isLoading ? <a className='animate-pulse'>Claiming...</a> : <a>Claim</a>}
                </button>
              </div>
            </dd>
          <dt className='flex justify-center'>
            Stake GENII 
            {GeniiTokenBalance?.value.toString() > '0' ?
            <div className='px-1'>
              <button 
                className='px-1 bg-gradient-to-r from-[#ff44c9] to-[#00b8fa] rounded-md text-xs text-white'
                onClick={() => setGeniiToStake(Number(GeniiTokenBalance?.formatted))}
              >
                MAX
              </button>
            </div>
            :
            null
            }
          </dt>
          <dd>
            {GeniiTokenBalance?.value.toString() > '0' ?
            <div className='flex ml-1 justify-center items-center p-2'>
              <input
                className='text-center font-2xl inline-block w-[8rem] h-[2rem] p-1 rounded-md'
                type="number"
                placeholder='Amount'
                pattern='^[0-9]*[.]?[0-9]*$'
                value={geniiToStake}
                min="0"
                max={GeniiTokenBalance?.formatted}
                onChange={event => {setGeniiToStake(Number(event.target.value))}}
              />
            </div>
            :
            null}
            <div className="flex justify-center text-center">
              <div className="p-1">
                <button
                  hidden={GeniiTokenBalance?.value.toString() == '0' || approvalComplete}
                  className="min-w-[8rem] rounded-md enabled:bg-gradient-to-r from-[#ff44c9] to-[#00b8fa] p-1.5 text-center text-sm text-white enabled:hover:scale-105 disabled:bg-gray-500"
                  onClick={() => approveSwapTokenWrite?.()}
                >
                  {approveStakeTokenLoading || approveStakeTokenWaitForTransaction.isLoading ? (
                    <a className='animate-pulse'>Approving...</a>
                  ) : (
                    <a>Approve GENII</a>
                  )}
                </button>
              </div>
              {approvalComplete ?
              <div className="p-1">
                <button
                  disabled={!approvalComplete}
                  className="min-w-[8rem] rounded-md enabled:bg-gradient-to-r from-[#ff44c9] to-[#00b8fa] p-1.5 text-center text-sm text-white enabled:hover:scale-105 disabled:bg-gray-500"
                  onClick={() => stakeTokenWrite?.()}
                >
                  {stakeTokenLoading || stakeTokenWaitForTransaction.isLoading ? <a className='animate-pulse'>Staking...</a> : <a> Stake</a>}
                </button>
              </div>
              :
              null}
              {GeniiTokenBalance?.value.toString() == '0' ?
                <div>You have no GENII tokens to stake!</div>
                :
                null
              }
            </div>
          </dd>
          <dt>Unstaking GENII</dt>
          {GeniiStakedBalance?.toString() > '0' ?
          <>
            <dd>There is an important difference between these functions, as <a className='font-bold'>exit</a> will unstake your tokens and claim any NII tokens you are due while <a className='font-bold'>withdraw</a> will unstake your tokens without claiming any due NII tokens.</dd>
            <dd className='flex-col justify-center items-center'>
              <dt className='flex justify-center'>
                Withdraw GENII
                <div className='px-1'>
                  <button 
                    className='px-1 bg-gradient-to-r from-[#ff44c9] to-[#00b8fa] rounded-md text-xs text-white'
                    onClick={() => setGeniiToUnStake(Number(formatUnits(GeniiStakedBalance?.toString(), 15)))}
                  >
                    MAX
                  </button>
                </div>
              </dt>
              <div>
                <div className="p-1">
                  <div className='flex justify-center items-center p-2'>
                    <input
                      className='text-center font-2xl inline-block w-[8rem] h-[2rem] p-1 rounded-md'
                      type="number"
                      placeholder='Amount'
                      pattern='^[0-9]*[.]?[0-9]*$'
                      value={geniiToUnStake}
                      min="0"
                      max={formatUnits(GeniiStakedBalance?.toString(), 15)}
                      onChange={event => {setGeniiToUnStake(Number(event.target.value))}}
                    />
                  </div>
                  <button
                    disabled={GeniiStakedBalance?.toString() == '0'}
                    className="min-w-[8rem] rounded-md enabled:bg-gradient-to-r from-[#ff44c9] to-[#00b8fa] p-1.5 text-center text-sm text-white enabled:hover:scale-105 disabled:bg-gray-500"
                    onClick={() => withdrawStakedTokenWrite?.()}
                  >
                    {withdrawStakedTokenLoading || withdrawStakedTokenWaitForTransaction.isLoading ? <a className='animate-pulse'>Withdrawing...</a> : <a>Withdraw</a>}
                  </button>
                </div>
              </div>
              <dt>Exit GENII</dt>
              <div className="p-1">
                  <button
                    disabled={GeniiStakedBalance?.toString() == '0'}
                    className="min-w-[8rem] rounded-md enabled:bg-gradient-to-r from-[#ff44c9] to-[#00b8fa] p-1.5 text-center text-sm text-white enabled:hover:scale-105 disabled:bg-gray-500"
                    onClick={() => exitStakedTokenWrite?.()}
                  >
                    {exitStakedTokenLoading || exitStakedTokenWaitForTransaction.isLoading ? <a className='animate-pulse'>Exiting...</a> : <a>Exit</a>}
                  </button>
              </div>
            </dd>
          </>
          :
          <dd>You have no staked GENII to unstake!</dd>
          }
        </dl>
        :
        <div className='flex-col justify-center'>
          <div>This is the gateway to the Genii staking platform.</div>
          <div className='flex justify-center p-4'>
            <img src='/arrowdown.png' alt="Arrow pointing down"></img>
          </div>
          <div className='flex justify-center'>
            <ConnectWallet show="disconnected" />
          </div>
        </div>
        }
      </div>
    </main>
  )
}


function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="flex items-center h-full text-center font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#ff44c9] to-[#00b8fa]">
        Created by: ꧁CryptoZii꧂
      </div>
      <div className="flex items-center text-white">Note: This dApp is community managed and not officially supported by the nahmii team.</div>
      <div></div>
    </footer>
  )
}
