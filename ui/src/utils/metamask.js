function requireMetaMask() {
  if (!window.ethereum) {
    throw new Error('No wallet found — install MetaMask first')
  }
}

// Ask MetaMask which account to use and return its address.
export async function pickMetaMaskAccount() {
  requireMetaMask()
  // Re-prompt the account picker even if already connected, so switching
  // accounts in MetaMask is reflected here instead of silently reusing
  // whichever address was granted first.
  await window.ethereum.request({
    method: 'wallet_requestPermissions',
    params: [{ eth_accounts: {} }],
  })
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
  return address
}
