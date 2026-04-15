import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback, useMemo } from 'react';
import { 
  GAIASPEAK_TOKENS, 
  ERC20_ABI, 
  BRACELET_RESERVATION_ADDRESS,
  BRACELET_RESERVATION_ABI,
  PREORDER_MIN_BALANCE,
  BRACELET_PRICE,
} from '../config/contracts';
import { saveReservation } from '../config/supabase';

export function usePreOrder() {
  const { address, isConnected } = useAccount();
  const [reservationStatus, setReservationStatus] = useState('idle'); // idle, checking, reserving, saving, success, error
  const [error, setError] = useState(null);
  const [reservationId, setReservationId] = useState(null);

  // Check if contracts are deployed (not zero address)
  const isContractDeployed = GAIASPEAK_TOKENS.GSG !== '0x0000000000000000000000000000000000000000';

  // Read GSG balance
  const { data: gsgBalance } = useReadContract({
    address: GAIASPEAK_TOKENS.GSG,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected && isContractDeployed,
    },
  });

  // Read GSS balance
  const { data: gssBalance } = useReadContract({
    address: GAIASPEAK_TOKENS.GSS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected && isContractDeployed,
    },
  });

  // Format balances (assuming 18 decimals)
  const formattedGSG = gsgBalance ? Number(gsgBalance) / 1e18 : 0;
  const formattedGSS = gssBalance ? Number(gssBalance) / 1e18 : 0;

  // Check eligibility - user needs minimum balance of either token
  const isEligible = useMemo(() => {
    if (!isConnected) return false;
    if (!isContractDeployed) {
      // For development, allow pre-orders without deployed contracts
      return true;
    }
    return formattedGSG >= PREORDER_MIN_BALANCE.GSG || formattedGSS >= PREORDER_MIN_BALANCE.GSS;
  }, [isConnected, isContractDeployed, formattedGSG, formattedGSS]);

  // Calculate how many bracelets user can afford
  const maxBracelets = useMemo(() => {
    if (!isContractDeployed) return 10; // Dev mode limit
    const maxFromGSG = Math.floor(formattedGSG / BRACELET_PRICE.GSG);
    const maxFromGSS = Math.floor(formattedGSS / BRACELET_PRICE.GSS);
    return Math.max(maxFromGSG, maxFromGSS, 0);
  }, [isContractDeployed, formattedGSG, formattedGSS]);

  // Write contract hook for reservation
  const { writeContractAsync, data: txHash } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Reserve wristband function
  const reserveWristband = useCallback(async (formData) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return { success: false, error: 'Wallet not connected' };
    }

    setReservationStatus('reserving');
    setError(null);

    try {
      let txHashResult = null;
      let nftId = null;

      // Check if contract is deployed
      if (BRACELET_RESERVATION_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        // Call smart contract
        txHashResult = await writeContractAsync({
          address: BRACELET_RESERVATION_ADDRESS,
          abi: BRACELET_RESERVATION_ABI,
          functionName: 'reserveWristband',
          args: [
            BigInt(formData.quantity),
            formData.size || '',
            formData.color || '',
          ],
        });
        
        // Wait for confirmation and get NFT ID from events
        // For now, use a placeholder
        nftId = `NFT-${Date.now()}`;
      } else {
        // Development mode - no contract interaction
        console.log('Development mode: Skipping contract call');
        txHashResult = `dev-tx-${Date.now()}`;
        nftId = `dev-nft-${Date.now()}`;
      }

      setReservationStatus('saving');

      // Save to Supabase
      const saveResult = await saveReservation({
        walletAddress: address.toLowerCase(),
        nftId: nftId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        streetAddress: formData.streetAddress,
        postalCode: formData.postalCode,
        quantity: formData.quantity,
        size: formData.size,
        color: formData.color,
        notes: formData.notes,
        txHash: txHashResult,
      });

      if (!saveResult.success && !saveResult.mock) {
        throw new Error(saveResult.error || 'Failed to save reservation');
      }

      setReservationId(nftId);
      setReservationStatus('success');
      return { success: true, nftId, txHash: txHashResult };
    } catch (err) {
      console.error('Reservation error:', err);
      setError(err.message || 'Failed to complete reservation');
      setReservationStatus('error');
      return { success: false, error: err.message };
    }
  }, [isConnected, address, writeContractAsync]);

  const resetStatus = useCallback(() => {
    setReservationStatus('idle');
    setError(null);
    setReservationId(null);
  }, []);

  return {
    isConnected,
    address,
    gsgBalance: formattedGSG,
    gssBalance: formattedGSS,
    isEligible,
    maxBracelets,
    isContractDeployed,
    reserveWristband,
    reservationStatus,
    error,
    reservationId,
    resetStatus,
    isConfirming,
    isConfirmed,
  };
}

