/**
 * Wallet Service - 钱包连接服务
 * 注意: 这是一个简化版实现，演示核心概念
 * 生产环境需要完整的 WalletConnect/Privy 集成
 */

export interface WalletState {
    isConnected: boolean;
    address: string | null;
    chainId: number | null;
    balance: string | null;
}

// 初始状态
const initialState: WalletState = {
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
};

// 模拟钱包状态 (MVP 用)
let walletState: WalletState = { ...initialState };

/**
 * 连接钱包 (模拟实现)
 */
export async function connectWallet(): Promise<WalletState> {
    // MVP: 模拟连接成功
    // 生产环境: 使用 WalletConnect 或 Privy
    return new Promise((resolve) => {
        setTimeout(() => {
            walletState = {
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
                chainId: 1337, // Anvil 本地链 (Localhost)
                balance: '10.0 ETH',
            };
            resolve(walletState);
        }, 1000);
    });
}

/**
 * 断开钱包连接
 */
export async function disconnectWallet(): Promise<void> {
    walletState = { ...initialState };
}

/**
 * 获取当前钱包状态
 */
export function getWalletState(): WalletState {
    return walletState;
}

/**
 * 检查是否已连接
 */
export function isWalletConnected(): boolean {
    return walletState.isConnected;
}

/**
 * 获取当前地址
 */
export function getAddress(): string | null {
    return walletState.address;
}

/**
 * 格式化地址显示 (缩短)
 */
export function formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 签名消息 (模拟实现)
 */
export async function signMessage(message: string): Promise<string> {
    // MVP: 返回模拟签名
    // 生产环境: 调用钱包签名
    return `0x${Buffer.from(message).toString('hex')}`;
}
