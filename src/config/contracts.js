// Chainlink AggregatorV3Interface ABI (minimal for reading prices)
export const CHAINLINK_AGGREGATOR_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Chainlink Price Feed Addresses on Ethereum Mainnet
// (Used for reading live gold/silver prices - read-only)
export const CHAINLINK_FEEDS = {
  XAU_USD: '0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6', // Gold/USD
  XAG_USD: '0x379589227b15F1336D27dDEC916B4688E9b9ad47', // Silver/USD (if available, otherwise mock)
};

// ERC20 Token ABI (minimal for balance checking)
export const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// GaiaSpeak Token Addresses on Polygon Amoy (PLACEHOLDER - update when deployed)
export const GAIASPEAK_TOKENS = {
  GSG: '0x0000000000000000000000000000000000000000', // GaiaSpeak Gold - TO BE DEPLOYED
  GSS: '0x0000000000000000000000000000000000000000', // GaiaSpeak Silver - TO BE DEPLOYED
};

// GaiaSpeak Protocol Contract ABI (purchaseTokens function - for reference)
export const GAIASPEAK_TOKEN_ABI = [
  {
    inputs: [],
    name: 'purchaseTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentStage',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Protocol stages
export const PROTOCOL_STAGES = {
  0: { name: 'GREEN', color: '#22c55e', description: 'Active - Pioneer rewards live' },
  1: { name: 'YELLOW', color: '#eab308', description: 'Transition phase' },
  2: { name: 'GOLD', color: '#f59e0b', description: 'Premium tier active' },
  3: { name: 'BLUE', color: '#3b82f6', description: 'Mature protocol' },
};

// Token distribution percentages
export const TOKEN_DISTRIBUTION = {
  reserve: 0.99,
  operations: 98, 
  founder: 1.0,
  pioneers: 0.01,
};

// Operations wallet for bracelet reservations
export const OPERATIONS_WALLET = '0x0000000000000000000000000000000000000000'; // TO BE SET

// WHITE Bracelet Pre-order Contract (Reservation + NFT)
export const BRACELET_RESERVATION_ADDRESS = '0x0000000000000000000000000000000000000000'; // TO BE DEPLOYED

export const BRACELET_RESERVATION_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'quantity', type: 'uint256' },
      { internalType: 'string', name: 'size', type: 'string' },
      { internalType: 'string', name: 'color', type: 'string' },
    ],
    name: 'reserveWristband',
    outputs: [{ internalType: 'uint256', name: 'reservationId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getReservationPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getReservations',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Minimum token balance required for pre-order (in tokens, 18 decimals)
export const PREORDER_MIN_BALANCE = {
  GSG: 0.1, // 0.1 gram of gold
  GSS: 1.0, // 1 gram of silver
};

// Bracelet price in tokens (placeholder)
export const BRACELET_PRICE = {
  GSG: 1.0, // 1 gram gold per bracelet
  GSS: 30.0, // 30 grams silver per bracelet
};

// Available bracelet options
export const BRACELET_OPTIONS = {
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  colors: ['Midnight Black', 'Arctic White', 'Rose Gold', 'Champagne'],
};

// Countries list for dropdown
export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia',
  'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany',
  'Ghana', 'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia', 'Ireland',
  'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Morocco',
  'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Saudi Arabia',
  'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
  'Taiwan', 'Thailand', 'Turkey', 'UAE', 'UK', 'Ukraine', 'USA', 'Vietnam',
];

