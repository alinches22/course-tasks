'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/modal';
import { formatAddress } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/use-auth';

export function ConnectButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isAuthenticated, signIn, signOut, isSigningIn } = useAuth();

  const handleConnect = async (connector: (typeof connectors)[number]) => {
    connect({ connector });
    setIsModalOpen(false);
  };

  const handleDisconnect = () => {
    signOut();
    disconnect();
  };

  // If connected but not authenticated, show sign-in button
  if (isConnected && !isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">{formatAddress(address || '')}</span>
        <Button onClick={signIn} isLoading={isSigningIn} size="sm">
          Sign In
        </Button>
        <Button onClick={handleDisconnect} variant="ghost" size="sm">
          Disconnect
        </Button>
      </div>
    );
  }

  // If authenticated, show account menu
  if (isAuthenticated && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="text-sm font-medium text-text-primary">{formatAddress(address)}</span>
        </div>
        <Button onClick={handleDisconnect} variant="ghost" size="sm">
          Disconnect
        </Button>
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} isLoading={isPending}>
        Connect Wallet
      </Button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="sm">
        <ModalHeader onClose={() => setIsModalOpen(false)}>Connect Wallet</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => handleConnect(connector)}
                className="flex items-center gap-3 p-4 rounded-lg bg-surface hover:bg-surface-hover border border-border transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-background-elevated flex items-center justify-center">
                  {connector.name === 'WalletConnect' && (
                    <svg className="w-6 h-6 text-accent-blue" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.913 7.519c3.915-3.831 10.26-3.831 14.174 0l.47.461a.483.483 0 010 .694l-1.611 1.577a.252.252 0 01-.354 0l-.649-.635c-2.73-2.673-7.157-2.673-9.887 0l-.694.68a.252.252 0 01-.354 0L4.397 8.719a.483.483 0 010-.694l.516-.506zm17.506 3.263l1.434 1.404a.483.483 0 010 .694l-6.466 6.331a.505.505 0 01-.708 0l-4.588-4.493a.126.126 0 00-.177 0l-4.588 4.493a.505.505 0 01-.708 0L.152 12.88a.483.483 0 010-.694l1.434-1.404a.505.505 0 01.708 0l4.588 4.493a.126.126 0 00.177 0l4.588-4.493a.505.505 0 01.708 0l4.588 4.493a.126.126 0 00.177 0l4.588-4.493a.505.505 0 01.708 0z" />
                    </svg>
                  )}
                  {connector.name === 'Coinbase Wallet' && (
                    <svg className="w-6 h-6 text-accent-blue" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5zm-2.625-8.625h5.25v3.75h-5.25v-3.75z" />
                    </svg>
                  )}
                  {connector.name === 'Injected' && (
                    <svg className="w-6 h-6 text-accent-purple" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-text-primary">{connector.name}</p>
                  <p className="text-sm text-text-secondary">
                    {connector.name === 'Injected' ? 'Browser Wallet' : 'Connect with ' + connector.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}
