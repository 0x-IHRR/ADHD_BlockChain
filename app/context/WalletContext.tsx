/**
 * Wallet Context - 管理 Web3 钱包连接状态
 * 支持 EIP-6963 多钱包检测 (MetaMask, OKX Wallet, Rabby 等)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { ethers } from 'ethers';
import { Platform } from 'react-native';

// ============ EIP-6963 类型定义 ============

interface EIP6963ProviderInfo {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
}

interface EIP6963ProviderDetail {
    info: EIP6963ProviderInfo;
    provider: any;
}

interface EIP6963AnnounceProviderEvent extends Event {
    detail: EIP6963ProviderDetail;
}

// ============ 网络配置 ============

interface NetworkConfig {
    chainId: number;
    name: string;
    shortName: string;
    rpcUrl?: string;
    symbol: string;
    explorer?: string;
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
    { chainId: 1, name: 'Ethereum Mainnet', shortName: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
    { chainId: 11155111, name: 'Sepolia Testnet', shortName: 'Sepolia', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
    { chainId: 31337, name: 'Anvil Local', shortName: 'Anvil', symbol: 'ETH', rpcUrl: 'http://127.0.0.1:8545' },
];

// ============ 钱包状态类型定义 ============

interface WalletState {
    isConnected: boolean;
    address: string | null;
    balance: string | null;
    chainId: number | null;
    isConnecting: boolean;
    error: string | null;
}

interface WalletContextType extends WalletState {
    connect: (provider?: any) => Promise<void>;
    disconnect: () => void;
    switchNetwork: (chainId: number) => Promise<void>;
    shortAddress: string;
    networkName: string;
    provider: ethers.BrowserProvider | null;
    signer: ethers.Signer | null;
    // EIP-6963 多钱包支持
    availableWallets: EIP6963ProviderDetail[];
    showWalletSelector: boolean;
    setShowWalletSelector: (show: boolean) => void;
    selectedWalletInfo: EIP6963ProviderInfo | null;
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

// 检查是否在浏览器环境
const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';

// 获取传统 ethereum 对象 (fallback)
const getEthereum = (): any => {
    if (isWeb()) {
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
    return eth.toFixed(4);
};

// ============ Provider ============

interface WalletProviderProps {
    children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [state, setState] = useState<WalletState>(initialState);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);

    // EIP-6963 多钱包状态
    const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const [selectedWalletInfo, setSelectedWalletInfo] = useState<EIP6963ProviderInfo | null>(null);
    const [currentProvider, setCurrentProvider] = useState<any>(null);

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

    // EIP-6963: 监听钱包扩展公告
    useEffect(() => {
        if (!isWeb()) return;

        const walletMap = new Map<string, EIP6963ProviderDetail>();

        const handleAnnounceProvider = (event: Event) => {
            const { detail } = event as EIP6963AnnounceProviderEvent;
            if (detail && detail.info && detail.provider) {
                walletMap.set(detail.info.uuid, detail);
                setAvailableWallets(Array.from(walletMap.values()));
            }
        };

        // 监听钱包公告事件
        window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);

        // 请求所有钱包公告自己
        window.dispatchEvent(new Event('eip6963:requestProvider'));

        // 如果 1 秒后没有检测到 EIP-6963 钱包，fallback 到传统检测
        const fallbackTimer = setTimeout(() => {
            if (walletMap.size === 0) {
                const ethereum = getEthereum();
                if (ethereum) {
                    // 创建一个伪 EIP-6963 条目
                    const fallbackWallet: EIP6963ProviderDetail = {
                        info: {
                            uuid: 'legacy-ethereum',
                            name: ethereum.isMetaMask ? 'MetaMask' :
                                ethereum.isOkxWallet ? 'OKX Wallet' :
                                    ethereum.isCoinbaseWallet ? 'Coinbase Wallet' :
                                        'Browser Wallet',
                            icon: '', // 无图标
                            rdns: 'unknown',
                        },
                        provider: ethereum,
                    };
                    setAvailableWallets([fallbackWallet]);
                }
            }
        }, 1000);

        return () => {
            window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
            clearTimeout(fallbackTimer);
        };
    }, []);

    // 连接钱包
    const connect = useCallback(async (selectedProvider?: any) => {
        // 如果没有指定 provider 且没有可用钱包，显示错误
        if (!selectedProvider && availableWallets.length === 0) {
            const ethereum = getEthereum();
            if (!ethereum) {
                setState(prev => ({
                    ...prev,
                    error: 'No wallet detected. Please install a Web3 wallet.',
                }));
                // 不再自动打开 MetaMask 下载页
                return;
            }
            selectedProvider = ethereum;
        }

        // 如果没有指定 provider，使用第一个可用的
        if (!selectedProvider) {
            selectedProvider = availableWallets[0]?.provider;
        }

        if (!selectedProvider) {
            setState(prev => ({
                ...prev,
                error: 'No wallet provider available',
            }));
            return;
        }

        setState(prev => ({ ...prev, isConnecting: true, error: null }));
        setShowWalletSelector(false);

        try {
            const browserProvider = new ethers.BrowserProvider(selectedProvider);
            const accounts = await browserProvider.send('eth_requestAccounts', []);

            // 记录当前使用的 provider
            setCurrentProvider(selectedProvider);

            // 设置选中的钱包信息
            const walletDetail = availableWallets.find(w => w.provider === selectedProvider);
            if (walletDetail) {
                setSelectedWalletInfo(walletDetail.info);
            }

            await updateWalletInfo(browserProvider, accounts);
        } catch (error: any) {
            console.error('Wallet connection failed:', error);
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error.message || 'Connection failed',
            }));
        }
    }, [updateWalletInfo, availableWallets]);

    // 断开连接
    const disconnect = useCallback(() => {
        setState(initialState);
        setProvider(null);
        setSigner(null);
        setCurrentProvider(null);
        setSelectedWalletInfo(null);
    }, []);

    // 切换网络
    const switchNetwork = useCallback(async (targetChainId: number) => {
        if (!currentProvider) {
            setState(prev => ({ ...prev, error: 'No wallet connected' }));
            return;
        }

        const network = SUPPORTED_NETWORKS.find(n => n.chainId === targetChainId);
        if (!network) {
            setState(prev => ({ ...prev, error: 'Unsupported network' }));
            return;
        }

        try {
            // 尝试切换网络
            await currentProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });
        } catch (switchError: any) {
            // 如果网络不存在，尝试添加
            if (switchError.code === 4902 && network.rpcUrl) {
                try {
                    await currentProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${targetChainId.toString(16)}`,
                            chainName: network.name,
                            nativeCurrency: {
                                name: network.symbol,
                                symbol: network.symbol,
                                decimals: 18,
                            },
                            rpcUrls: [network.rpcUrl],
                            blockExplorerUrls: network.explorer ? [network.explorer] : undefined,
                        }],
                    });
                } catch (addError: any) {
                    console.error('Failed to add network:', addError);
                    setState(prev => ({ ...prev, error: addError.message || 'Failed to add network' }));
                }
            } else {
                console.error('Failed to switch network:', switchError);
                setState(prev => ({ ...prev, error: switchError.message || 'Failed to switch network' }));
            }
        }
    }, [currentProvider]);

    // 获取当前网络名称
    const networkName = useMemo(() => {
        if (!state.chainId) return 'Unknown';
        const network = SUPPORTED_NETWORKS.find(n => n.chainId === state.chainId);
        return network?.shortName || `Chain ${state.chainId}`;
    }, [state.chainId]);

    // 监听钱包事件
    useEffect(() => {
        if (!currentProvider) return;

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else if (provider) {
                await updateWalletInfo(provider, accounts);
            }
        };

        const handleChainChanged = () => {
            // 链变更时刷新页面
            if (isWeb()) {
                window.location.reload();
            }
        };

        const handleDisconnect = () => {
            disconnect();
        };

        currentProvider.on?.('accountsChanged', handleAccountsChanged);
        currentProvider.on?.('chainChanged', handleChainChanged);
        currentProvider.on?.('disconnect', handleDisconnect);

        return () => {
            currentProvider.removeListener?.('accountsChanged', handleAccountsChanged);
            currentProvider.removeListener?.('chainChanged', handleChainChanged);
            currentProvider.removeListener?.('disconnect', handleDisconnect);
        };
    }, [currentProvider, provider, updateWalletInfo, disconnect]);

    // 启动时检查是否已连接
    useEffect(() => {
        if (!isWeb()) return;

        const checkConnection = async () => {
            // 优先检查 EIP-6963 钱包
            for (const wallet of availableWallets) {
                try {
                    const accounts = await wallet.provider.request?.({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        const browserProvider = new ethers.BrowserProvider(wallet.provider);
                        setCurrentProvider(wallet.provider);
                        setSelectedWalletInfo(wallet.info);
                        await updateWalletInfo(browserProvider, accounts);
                        return;
                    }
                } catch (e) {
                    // 忽略错误，继续检查下一个
                }
            }

            // Fallback: 检查传统 ethereum
            const ethereum = getEthereum();
            if (ethereum) {
                try {
                    const accounts = await ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        const browserProvider = new ethers.BrowserProvider(ethereum);
                        setCurrentProvider(ethereum);
                        await updateWalletInfo(browserProvider, accounts);
                    }
                } catch (error) {
                    console.error('Failed to check wallet connection:', error);
                }
            }
        };

        // 等待钱包检测完成后再检查连接
        const timer = setTimeout(checkConnection, 1500);
        return () => clearTimeout(timer);
    }, [availableWallets, updateWalletInfo]);

    const value: WalletContextType = {
        ...state,
        connect,
        disconnect,
        switchNetwork,
        shortAddress: formatAddress(state.address),
        networkName,
        provider,
        signer,
        availableWallets,
        showWalletSelector,
        setShowWalletSelector,
        selectedWalletInfo,
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
