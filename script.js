let deferredPrompt;

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }

  const supabase = window.supabase.createClient(
    'https://idtajnzyikcrqqyeephb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkdGFqbnp5aWtjcnFxeWVlcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNzExODEsImV4cCI6MjA1NjY0NzE4MX0.dmdooctqxdRcA3DkKXHo8T2jE69AFUpccrgpm7V73lI'
  );
  window.supabaseClient = supabase;
});

function isStandalone() {
  return (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt event fired!');
});

const kasToSwodnRate = 10;
const swodnToKasRate = 0.022;
const ksdogToSwodnBuyRate = 100000;
const ksdogToSwodnSellRate = 0.000909;
const kangoToSwodnRate = 250;
const swodnToKangoRate = 330;
const nachoToSwodnRate = 100;
const swodnToNachoRate = 165;
const usdcToSwodnRate = 500;
const swodnToUsdcRate = 0.002;
const mmediaToSwodnRate = 5;
const swodnToMmediaRate = 5;
const ghoadToSwodnRate = 100;
const swodnToGhoadRate = 300;
const minSwodnForUsdc = 500;

const sendInput = document.getElementById('send-amount');
const swodnInput = document.getElementById('swodn-amount');
const buyBtn = document.getElementById('buy-btn');
const sellBtn = document.getElementById('sell-btn');
const toggleBtn = document.getElementById('toggle-btn');
const sendLabel = document.getElementById('send-label');
const getLabel = document.getElementById('get-label');
const selectedCurrency = document.getElementById('selected-currency');
const currencyList = document.getElementById('currency-list');
const connectBtn = document.getElementById('connect-kasware-btn');
const kaswareConnectDiv = document.getElementById('kasware-connect');

if (!sendInput || !swodnInput || !buyBtn || !sellBtn || !toggleBtn || !sendLabel || !getLabel || !selectedCurrency || !currencyList || !connectBtn || !kaswareConnectDiv) {
  console.error('Required elements not found:', {
    sendInput, swodnInput, buyBtn, sellBtn, toggleBtn, sendLabel, getLabel, selectedCurrency, currencyList, connectBtn, kaswareConnectDiv
  });
}

let isKasToSwodn = true;
let selectedCurrencyValue = 'KAS';
const maxSnowdn = 1000;
const minSnowdn = 10;
const minKsdogBuy = 100000;

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

class KaswareState extends EventTarget {
  constructor() {
    super();
    this.state = {
      account: null,
      isConnected: false,
      balance: null,
      krc20Balances: null,
      isLoading: false,
      error: null,
      isMobile: isMobile()
    };
    this.initialize();
  }

  static getInstance() {
    if (!KaswareState.instance) {
      KaswareState.instance = new KaswareState();
    }
    return KaswareState.instance;
  }

  initialize() {
    if (window.kasware || (this.state.isMobile && window.kaspaWallet)) {
      if (window.kasware) {
        window.kasware.on("accountsChanged", this.handleAccountsChanged.bind(this));
        window.kasware.on("chainChanged", this.handleChainChanged.bind(this));
        window.kasware.on("disconnect", this.handleDisconnect.bind(this));
      }
    } else {
      this.setState({ error: "Kasware wallet not detected. Please install the extension or mobile app" });
    }
  }

  async connectWallet() {
    const wallet = this.state.isMobile && window.kaspaWallet ? window.kaspaWallet : window.kasware;
    if (!wallet) {
      alert("Please install Kasware Wallet extension or mobile app");
      return;
    }
    this.setState({ isLoading: true, error: null });
    try {
      const accounts = await wallet.requestAccounts();
      if (accounts.length > 0) {
        this.setState({
          account: accounts[0],
          isConnected: true,
          isLoading: false,
        });
        await this.refreshBalances();
        kaswareConnectDiv.style.display = 'none';
        connectBtn.textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
      }
    } catch (error) {
      this.setState({ 
        error: error.message || "Failed to connect wallet", 
        isLoading: false 
      });
      throw error;
    }
  }

  async refreshBalances() {
    if (this.state.account) {
      try {
        const wallet = this.state.isMobile && window.kaspaWallet ? window.kaspaWallet : window.kasware;
        const [balance, krc20Balances] = await Promise.all([
          wallet.getBalance(),
          wallet.getKRC20Balance()
        ]);
        this.setState({ balance, krc20Balances });
      } catch (error) {
        this.setState({ error: "Failed to fetch balances" });
        throw error;
      }
    }
  }

  async sendTransaction(toAddress, amount) {
    try {
      const wallet = this.state.isMobile && window.kaspaWallet ? window.kaspaWallet : window.kasware;
      const txid = await wallet.sendKaspa(toAddress, amount);
      return txid;
    } catch (error) {
      this.setState({ error: "Transaction failed" });
      throw error;
    }
  }

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.setState({
        account: null,
        isConnected: false,
        balance: null,
        krc20Balances: null,
      });
      const isMobile = window.innerWidth <= 768;
      connectBtn.textContent = isMobile ? "Connect Kasware" : "Connect Kasware Wallet";
      kaswareConnectDiv.style.display = 'block';
    } else {
      this.setState({ account: accounts[0], isConnected: true });
      connectBtn.textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
      kaswareConnectDiv.style.display = 'none';
      this.refreshBalances().catch(console.error);
    }
  }

  handleChainChanged() {
    this.connectWallet().catch(console.error);
  }

  handleDisconnect() {
    this.setState({
      account: null,
      isConnected: false,
      balance: null,
      krc20Balances: null,
    });
    connectBtn.textContent = "Connect Kasware Wallet";
    kaswareConnectDiv.style.display = 'block';
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.dispatchEvent(new CustomEvent("stateChanged", { detail: this.state }));
  }

  getState() {
    return { ...this.state };
  }
}

function addMultiPlatformListeners(element, callback) {
  element.addEventListener('click', callback);
  element.addEventListener('touchend', (e) => {
    e.preventDefault();
    callback(e);
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function setupInputListeners(input) {
  if (input === sendInput) {
    input.addEventListener('input', debounce(updateExchangeValues, 300));
  } else if (input === swodnInput) {
    input.addEventListener('input', debounce(updateReverseExchangeValues, 300));
  }
  input.addEventListener('touchstart', () => input.focus());
}

if (sendInput && swodnInput) {
  setupInputListeners(sendInput);
  setupInputListeners(swodnInput);
}

addMultiPlatformListeners(connectBtn, async () => {
  const kaswareState = KaswareState.getInstance();
  try {
    await kaswareState.connectWallet();
  } catch (error) {
    console.error('Connection failed:', error);
  }
});

function updateExchangeValues() {
  console.log('updateExchangeValues called', {
    sendInput: sendInput.value,
    selectedCurrencyValue,
    isKasToSwodn,
  });
  const sendAmount = parseFloat(sendInput.value);
  let calculatedAmount = 0;

  if (!isNaN(sendAmount)) {
    if (selectedCurrencyValue === 'KAS') {
      calculatedAmount = isKasToSwodn ? sendAmount * kasToSwodnRate : sendAmount * swodnToKasRate;
      console.log('KAS calculation', { sendAmount, calculatedAmount });
    } else if (selectedCurrencyValue === 'KSDOG') {
      if (isKasToSwodn && sendAmount >= minKsdogBuy) {
        calculatedAmount = Math.floor(sendAmount / ksdogToSwodnBuyRate);
      } else if (!isKasToSwodn) {
        calculatedAmount = Math.floor(sendAmount / ksdogToSwodnSellRate);
      }
    } else if (selectedCurrencyValue === 'KANGO') {
      calculatedAmount = isKasToSwodn ? sendAmount / kangoToSwodnRate : sendAmount * swodnToKangoRate;
    } else if (selectedCurrencyValue === 'NACHO') {
      calculatedAmount = isKasToSwodn ? sendAmount / nachoToSwodnRate : sendAmount * swodnToNachoRate;
    } else if (selectedCurrencyValue === 'USDC') {
      calculatedAmount = isKasToSwodn ? sendAmount * usdcToSwodnRate : sendAmount / swodnToUsdcRate;
    } else if (selectedCurrencyValue === 'MMEDIA') {
      calculatedAmount = isKasToSwodn ? sendAmount * mmediaToSwodnRate : sendAmount / swodnToMmediaRate;
    } else if (selectedCurrencyValue === 'GHOAD') {
      calculatedAmount = isKasToSwodn ? sendAmount / ghoadToSwodnRate : sendAmount * swodnToGhoadRate;
    }

    calculatedAmount = Math.floor(calculatedAmount);
    if (calculatedAmount < minSnowdn) {
      calculatedAmount = 0;
    } else if (calculatedAmount > maxSnowdn) {
      calculatedAmount = maxSnowdn;
      if (selectedCurrencyValue === 'KAS') {
        sendInput.value = Math.floor(maxSnowdn / kasToSwodnRate);
      } else if (selectedCurrencyValue === 'KSDOG') {
        sendInput.value = Math.floor(maxSnowdn * ksdogToSwodnBuyRate);
      } else if (selectedCurrencyValue === 'KANGO') {
        sendInput.value = Math.floor(maxSnowdn * kangoToSwodnRate);
      } else if (selectedCurrencyValue === 'NACHO') {
        sendInput.value = Math.floor(maxSnowdn * nachoToSwodnRate);
      } else if (selectedCurrencyValue === 'USDC') {
        sendInput.value = Math.floor(maxSnowdn / usdcToSwodnRate);
      } else if (selectedCurrencyValue === 'MMEDIA') {
        sendInput.value = Math.floor(maxSnowdn / mmediaToSwodnRate);
      } else if (selectedCurrencyValue === 'GHOAD') {
        sendInput.value = Math.floor(maxSnowdn * ghoadToSwodnRate);
      }
    }
    swodnInput.value = calculatedAmount;
  } else {
    swodnInput.value = '';
  }
}

function updateReverseExchangeValues() {
  console.log('updateReverseExchangeValues called', {
    swodnInput: swodnInput.value,
    selectedCurrencyValue,
    isKasToSwodn,
  });
  const swodnAmount = parseFloat(swodnInput.value);
  let calculatedAmount = 0;

  if (!isNaN(swodnAmount)) {
    if (selectedCurrencyValue === 'KAS') {
      calculatedAmount = isKasToSwodn
        ? Math.floor(swodnAmount / kasToSwodnRate)
        : Math.floor(swodnAmount / swodnToKasRate);
      console.log('KAS reverse calculation', { swodnAmount, calculatedAmount });
    } else if (selectedCurrencyValue === 'KSDOG') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * ksdogToSwodnBuyRate
        : swodnAmount * ksdogToSwodnSellRate;
    } else if (selectedCurrencyValue === 'KANGO') {
      calculatedAmount = isKasToSwodn ? swodnAmount * kangoToSwodnRate : swodnAmount / swodnToKangoRate;
    } else if (selectedCurrencyValue === 'NACHO') {
      calculatedAmount = isKasToSwodn ? swodnAmount * nachoToSwodnRate : swodnAmount / swodnToNachoRate;
    } else if (selectedCurrencyValue === 'USDC') {
      calculatedAmount = isKasToSwodn ? swodnAmount / usdcToSwodnRate : swodnAmount * swodnToUsdcRate;
    } else if (selectedCurrencyValue === 'MMEDIA') {
      calculatedAmount = isKasToSwodn ? swodnAmount / mmediaToSwodnRate : swodnAmount * swodnToMmediaRate;
    } else if (selectedCurrencyValue === 'GHOAD') {
      calculatedAmount = isKasToSwodn ? swodnAmount * ghoadToSwodnRate : swodnAmount / swodnToGhoadRate;
    }

    const swodnAmountRounded = Math.floor(swodnAmount);
    if (swodnAmountRounded < minSnowdn) {
      swodnInput.value = 0;
      calculatedAmount = 0;
    } else if (swodnAmountRounded > maxSnowdn) {
      swodnInput.value = maxSnowdn;
      if (selectedCurrencyValue === 'KAS') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / kasToSwodnRate)
          : Math.floor(maxSnowdn / swodnToKasRate);
      } else if (selectedCurrencyValue === 'KSDOG') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn * ksdogToSwodnBuyRate)
          : Math.floor(maxSnowdn * ksdogToSwodnSellRate);
      } else if (selectedCurrencyValue === 'KANGO') {
        calculatedAmount = isKasToSwodn ? Math.floor(maxSnowdn * kangoToSwodnRate) : Math.floor(maxSnowdn / swodnToKangoRate);
      } else if (selectedCurrencyValue === 'NACHO') {
        calculatedAmount = isKasToSwodn ? Math.floor(maxSnowdn * nachoToSwodnRate) : Math.floor(maxSnowdn / swodnToNachoRate);
      } else if (selectedCurrencyValue === 'USDC') {
        calculatedAmount = isKasToSwodn ? Math.floor(maxSnowdn / usdcToSwodnRate) : Math.floor(maxSnowdn * swodnToUsdcRate);
      } else if (selectedCurrencyValue === 'MMEDIA') {
        calculatedAmount = isKasToSwodn ? Math.floor(maxSnowdn / mmediaToSwodnRate) : Math.floor(maxSnowdn * swodnToMmediaRate);
      } else if (selectedCurrencyValue === 'GHOAD') {
        calculatedAmount = isKasToSwodn ? Math.floor(maxSnowdn * ghoadToSwodnRate) : Math.floor(maxSnowdn * swodnToGhoadRate);
      }
    }
    sendInput.value = calculatedAmount.toFixed(2);
  } else {
    sendInput.value = '';
  }
}

addMultiPlatformListeners(toggleBtn, () => {
  isKasToSwodn = !isKasToSwodn;
  updateLabels();
  resetInputs();
});

addMultiPlatformListeners(selectedCurrency, () => {
  currencyList.style.display = currencyList.style.display === "block" ? "none" : "block";
  if (isMobile()) {
    currencyList.style.maxHeight = `${window.innerHeight * 0.5}px`;
    currencyList.style.overflowY = 'auto';
  }
});

addMultiPlatformListeners(currencyList, (e) => {
  const target = e.target.tagName === "LI" ? e.target : e.target.closest("LI");
  if (target) {
    selectedCurrencyValue = target.dataset.value;
    let currencyIcon = target.dataset.icon;
    selectedCurrency.innerHTML = `
      <img src="${currencyIcon}" alt="${selectedCurrencyValue} Logo" class="currency-logo" />
      <span>${selectedCurrencyValue}</span>
    `;
    currencyList.style.display = "none";
    updateLabels();
    resetInputs();
  }
});

document.addEventListener('touchend', (e) => {
  if (!selectedCurrency.contains(e.target) && !currencyList.contains(e.target)) {
    currencyList.style.display = "none";
  }
});

document.addEventListener('click', (e) => {
  if (!selectedCurrency.contains(e.target) && !currencyList.contains(e.target)) {
    currencyList.style.display = "none";
  }
});

function updateLabels() {
  console.log('updateLabels', { selectedCurrencyValue, isKasToSwodn });
  sendLabel.textContent = isKasToSwodn ? `You Send (${selectedCurrencyValue}):` : `You Send (SNOWDN):`;
  getLabel.textContent = isKasToSwodn ? `You Get (SNOWDN):` : `You Get (${selectedCurrencyValue}):`;
}

function resetInputs() {
  sendInput.value = '';
  swodnInput.value = '';
}

async function logTransactionToSupabase(action, currency, amount, txid = null) {
  const kaswareState = KaswareState.getInstance().getState();
  const sendAmount = parseFloat(sendInput.value);
  const convertedAmount = parseFloat(swodnInput.value);
  let rate;
  let sourceCurrency;
  let convertCurrency;

  if (isKasToSwodn) {
    sourceCurrency = selectedCurrencyValue;
    convertCurrency = 'SNOWDN';
  } else {
    sourceCurrency = 'SNOWDN';
    convertCurrency = selectedCurrencyValue;
  }

  if (selectedCurrencyValue === 'KAS') {
    rate = isKasToSwodn ? kasToSwodnRate : swodnToKasRate;
  } else if (selectedCurrencyValue === 'KSDOG') {
    rate = isKasToSwodn ? ksdogToSwodnBuyRate : ksdogToSwodnSellRate;
  } else if (selectedCurrencyValue === 'KANGO') {
    rate = isKasToSwodn ? kangoToSwodnRate : swodnToKangoRate;
  } else if (selectedCurrencyValue === 'NACHO') {
    rate = isKasToSwodn ? nachoToSwodnRate : swodnToNachoRate;
  } else if (selectedCurrencyValue === 'USDC') {
    rate = isKasToSwodn ? usdcToSwodnRate : swodnToUsdcRate;
  } else if (selectedCurrencyValue === 'MMEDIA') {
    rate = isKasToSwodn ? mmediaToSwodnRate : swodnToMmediaRate;
  } else if (selectedCurrencyValue === 'GHOAD') {
    rate = isKasToSwodn ? ghoadToSwodnRate : swodnToGhoadRate;
  }

  const transactionData = {
    action,
    source_currency: sourceCurrency,
    amount: sendAmount,
    converted_amount: convertedAmount,
    rate,
    wallet_address: kaswareState.account || 'N/A',
    convert_currency: convertCurrency,
    transaction_id: txid,
    created_at: new Date().toISOString()
  };

  if (!window.supabaseClient) {
    console.warn('Supabase client not available, logging to console only');
    console.log('Transaction:', transactionData);
    return;
  }

  if (!txid) {
    console.log('Logging manual transaction:', transactionData);
    localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
  } else {
    const { error } = await window.supabaseClient
      .from('transactions')
      .insert([transactionData]);
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    console.log('Transaction recorded in Supabase:', transactionData);
  }
}

async function handleTransaction(action) {
  const kaswareState = KaswareState.getInstance();
  const state = kaswareState.getState();
  
  if (!state.isConnected) {
    alert("Please connect Kasware wallet first");
    return;
  }

  const sendAmount = parseFloat(sendInput.value);
  const convertedAmount = parseFloat(swodnInput.value);
  
  if (!sendAmount || !convertedAmount) {
    alert("Please enter valid amounts");
    return;
  }

  const paymentMethod = await new Promise(resolve => {
    const message = "Would you like to pay automatically?\nOK = Automatic\nCancel = Manual";
    resolve(confirm(message));
  });

  const treasuryAddress = "kaspa:qyp60g7z60kk77vrjm2muz5knlex9uxlp88r2sznwsl30mxzrxwp2cglt7f5czn";

  if (paymentMethod) {
    try {
      let txid;
      if (action === 'Buy' && isKasToSwodn && selectedCurrencyValue === 'KAS') {
        const amountInSompi = Math.floor(sendAmount * 100000000);
        txid = await kaswareState.sendTransaction(treasuryAddress, amountInSompi);
      }
      if (txid) {
        await logTransactionToSupabase(action, selectedCurrencyValue, convertedAmount, txid);
        return txid;
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      throw error;
    }
  } else {
    await logTransactionToSupabase(action, selectedCurrencyValue, convertedAmount);
    return null;
  }
}

addMultiPlatformListeners(buyBtn, async (e) => {
  e.preventDefault();
  try {
    const txid = await handleTransaction('Buy');
    if (txid) {
      alert(`Automatic transaction successful! TXID: ${txid}`);
    }
    window.location.href = './buytreasury.html';
  } catch (error) {
    alert('Transaction failed. Please try again.');
  }
});

addMultiPlatformListeners(sellBtn, async (e) => {
  e.preventDefault();
  try {
    const txid = await handleTransaction('Sell');
    if (txid) {
      alert(`Automatic transaction successful! TXID: ${txid}`);
    }
    window.location.href = './selltreasury.html';
  } catch (error) {
    alert('Transaction failed. Please try again.');
  }
});

window.addEventListener('resize', () => {
  if (currencyList.style.display === 'block' && isMobile()) {
    currencyList.style.maxHeight = `${window.innerHeight * 0.5}px`;
  }
});

function showAddToHomeScreenPrompt() {
  const siteName = "SNOWDN SWAP";
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (!isStandalone()) {
    const promptDiv = document.createElement('div');
    promptDiv.id = 'add-to-home-prompt';
    promptDiv.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1e1e2f 0%, #2a2a4a 100%);
      color: #ffffff;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      z-index: 1000;
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 90%;
      width: 340px;
      text-align: center;
      opacity: 0;
      animation: fadeIn 0.5s ease forwards;
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(styleSheet);

    if (isAndroid) {
      promptDiv.innerHTML = `
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">
          Add ${siteName} to Your Home Screen
        </div>
        <div style="font-size: 14px; color: #d1d1d6; margin-bottom: 20px;">
          Access your DeFi tools faster with one tap!
        </div>
        <div style="display: flex; justify-content: center; gap: 15px;">
          <button id="install-btn" style="
            padding: 10px 20px;
            background: linear-gradient(90deg, #00d4ff, #007bff);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          ">Add Now</button>
          <button id="dismiss-btn" style="
            padding: 10px 20px;
            background: #ff4d4d;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          ">Not Now</button>
        </div>
      `;
    } else if (isIOS) {
      promptDiv.innerHTML = `
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">
          Add ${siteName} to Your Home Screen
        </div>
        <div style="font-size: 14px; color: #d1d1d6; margin-bottom: 20px;">
          ${isSafari ? 
            'Tap <strong style="color: #00d4ff;">Share</strong> below, scroll down, select <strong style="color: #00d4ff;">Add to Home Screen</strong>, then tap <strong style="color: #00d4ff;">Add</strong>.' : 
            'Open in Safari, then tap <strong style="color: #00d4ff;">Share</strong>, scroll down, select <strong style="color: #00d4ff;">Add to Home Screen</strong>, and tap <strong style="color: #00d4ff;">Add</strong>.'}
        </div>
        <button id="dismiss-btn" style="
          padding: 10px 20px;
          background: #ff4d4d;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        ">Dismiss</button>
      `;
    }

    document.body.appendChild(promptDiv);

    const buttons = promptDiv.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('mouseover', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
      });
      button.addEventListener('mouseout', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = 'none';
      });
    });

    if (isAndroid) {
      const installBtn = document.getElementById('install-btn');
      const dismissBtn = document.getElementById('dismiss-btn');

      addMultiPlatformListeners(installBtn, async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(outcome === 'accepted' ? 'User accepted the A2HS prompt' : 'User dismissed the A2HS prompt');
          deferredPrompt = null;
          promptDiv.remove();
        } else {
          alert(`Please use a supported browser like Chrome to add ${siteName} to your home screen automatically.`);
        }
      });

      addMultiPlatformListeners(dismissBtn, () => {
        promptDiv.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => promptDiv.remove(), 300);
      });
    } else if (isIOS) {
      const dismissBtn = document.getElementById('dismiss-btn');
      addMultiPlatformListeners(dismissBtn, () => {
        promptDiv.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => promptDiv.remove(), 300);
      });
    }

    styleSheet.textContent += `
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const kaswareState = KaswareState.getInstance();
  
  if ((!window.kasware && !window.kaspaWallet) || !kaswareState.getState().isConnected) {
    kaswareConnectDiv.style.display = 'block';
  }

  if (isMobile()) {
    sendInput.style.fontSize = '16px';
    swodnInput.style.fontSize = '16px';
  }

  kaswareState.addEventListener("stateChanged", (event) => {
    const state = event.detail;
    console.log('Wallet state changed:', state);
    if (state.isConnected) {
      console.log('Wallet connected:', state.account);
      console.log('Balance:', state.balance);
    }
  });

  updateLabels();
  
  setTimeout(showAddToHomeScreenPrompt, 3000); 
});