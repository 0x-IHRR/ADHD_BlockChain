/**
 * Wallet Context - 管理 Web3 钱包连接状态
 * 支持 MetaMask 等浏览器扩展钱包
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { Platform } from 'react-native';

// ============ 类型定义 ============

interface WalletState {
    isConnected: boolean;
    address: string | null;
    balance: string | null;
    chainId: number | null;
    isConnecting: boolean;
    error: string | null;
}

interface WalletContextType extends WalletState {
    connect: () => Promise<void>;
    disconnect: () => void;
    shortAddress: string;
    provider: ethers.BrowserProvider | null;
    signer: ethers.Signer | null;
}

// ============ 初始状态 ============

const initialState: WalletState = {
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    error: null,
};

// ============ Context ============

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ============ 辅助函数 ============

// 检查是否在浏览器环境且有 ethereum 对象
const getEthereum = (): any => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return (window as any).ethereum;
    }
    return null;
};

// 格式化地址为短格式
const formatAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 格式化余额
const formatBalance = (balance: bigint): string => {
    const eth = Number(balance) / 1e18;
    return `${eth.toFixed(4)} ETH`;
};

// ============ Provider ============

interface WalletProviderProps {
    children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [state, setState] = useState<WalletState>(initialState);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);

    // 更新钱包信息
    const updateWalletInfo = useCallback(async (browserProvider: ethers.BrowserProvider, accounts: string[]) => {
        if (accounts.length === 0) {
            setState(initialState);
            setProvider(null);
            setSigner(null);
            return;
        }

        try {
            const address = accounts[0];
            const network = await browserProvider.getNetwork();
            const balance = await browserProvider.getBalance(address);
            const walletSigner = await browserProvider.getSigner();

            setState({
                isConnected: true,
                address,
                balance: formatBalance(balance),
                chainId: Number(network.chainId),
                isConnecting: false,
                error: null,
            });
            setProvider(browserProvider);
            setSigner(walletSigner);
        } catch (error) {
            console.error('Failed to update wallet info:', error);
        }
    }, []);

    // 连接钱包
    const connect = useCallback(async () => {
        const ethereum = getEthereum();

        if (!ethereum) {
            setState(prev => ({
                ...prev,
                error: 'Please install MetaMask or another Web3 wallet',
            }));

            // 打开 MetaMask 安装页面
            if (Platform.OS === 'web') {
                window.open('https://metamask.io/download/', '_blank');
            }
            return;
        }

        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const browserProvider = new ethers.BrowserProvider(ethereum);
            const accounts = await browserProvider.send('eth_requestAccounts', []);
            await updateWalletInfo(browserProvider, accounts);
        } catch (error: any) {
            console.error('Wallet connection failed:', error);
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error.message || 'Connection failed',
            }));
        }
    }, [updateWalletInfo]);

    // 断开连接
    const disconnect = useCallback(() => {
        setState(initialState);
        setProvider(null);
        setSigner(null);
    }, []);

    // 监听钱包事件
    useEffect(() => {
        const ethereum = getEthereum();
        if (!ethereum) return;

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else if (provider) {
                await updateWalletInfo(provider, accounts);
            }
        };

        const handleChainChanged = () => {
            // 链变更时刷新页面（推荐做法）
            if (Platform.OS === 'web') {
                window.location.reload();
            }
        };

        const handleDisconnect = () => {
            disconnect();
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('disconnect', handleDisconnect);

        // 检查是否已经连接
        const checkConnection = async () => {
            try {
                const accounts = await ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    const browserProvider = new ethers.BrowserProvider(ethereum);
                    await updateWalletInfo(browserProvider, accounts);
                }
            } catch (error) {
                console.error('Failed to check wallet connection:', error);
            }
        };

        checkConnection();

        return () => {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
            ethereum.removeListener('disconnect', handleDisconnect);
        };
    }, [provider, updateWalletInfo, disconnect]);

    const value: WalletContextType = {
        ...state,
        connect,
        disconnect,
        shortAddress: formatAddress(state.address),
        provider,
        signer,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

// ============ Hook ============

export const useWallet = (): WalletContextType => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
};

export default {
    WalletProvider,
    useWallet,
};
