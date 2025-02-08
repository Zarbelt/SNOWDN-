// Exchange Rates
const kasToSwodnRate = 10; // 1 KAS = 10 SNOWDN (BUY)
const swodnToKasRate = 0.02; // 1 SNOWDN = 0.02 KAS (SELL)
const ksdogToSwodnBuyRate = 100000; // 100,000 KSDOG = 1 SNOWDN (BUY)
const ksdogToSwodnSellRate = 0.001; // 200,000 KSDOG = 1 SNOWDN (SELL)
const kangoToSwodnRate = 250; // 1 SNOWDN = 250 KANGO (BUY)
const swodnToKangoRate = 300; // 300 KANGO = 1 SNOWDN (SELL)
const nachoToSwodnRate = 100; // 1 SNOWDN = 100 NACHO (BUY)
const swodnToNachoRate = 150; // 150 NACHO = 1 SNOWDN (SELL)
const usdcToSwodnRate = 500;
const swodnToUsdcRate = 0.002;
const minSwodnForUsdc = 500; // Minimum SWODN for USDC conversions

// DOM Elements
const sendInput = document.getElementById('send-amount');
const swodnInput = document.getElementById('swodn-amount');
const buyBtn = document.getElementById('buy-btn');
const sellBtn = document.getElementById('sell-btn');
const toggleBtn = document.getElementById('toggle-btn');
const sendLabel = document.getElementById('send-label');
const getLabel = document.getElementById('get-label');
const selectedCurrency = document.getElementById("selected-currency");
const currencyList = document.getElementById("currency-list");

// Initial State
let isKasToSwodn = true; // Default mode: You send KAS, get SNOWDN
let selectedCurrencyValue = 'KAS'; // Default currency
const maxSnowdn = 1000; // Maximum SNOWDN per transaction
const minSnowdn = 10; // Minimum SWODN for any transaction
const minKsdogBuy = 100000; // Minimum KSDOG for buy transaction

sendInput.addEventListener('input', () => {
  updateExchangeValues();
});

swodnInput.addEventListener('input', () => {
  updateReverseExchangeValues();
});

function updateExchangeValues() {
  const sendAmount = parseFloat(sendInput.value);
  let calculatedAmount = 0;

  if (!isNaN(sendAmount)) {
    if (selectedCurrencyValue === 'KAS') {
      calculatedAmount = isKasToSwodn
        ? sendAmount * kasToSwodnRate
        : sendAmount * swodnToKasRate;
    } else if (selectedCurrencyValue === 'KSDOG') {
      if (isKasToSwodn && sendAmount >= minKsdogBuy) {
        calculatedAmount = Math.floor(sendAmount / ksdogToSwodnBuyRate);
      } else if (!isKasToSwodn) {
        calculatedAmount = Math.floor(sendAmount / ksdogToSwodnSellRate);
      }
    } else if (selectedCurrencyValue === 'KANGO') {
      calculatedAmount = isKasToSwodn
        ? sendAmount / kangoToSwodnRate
        : sendAmount * swodnToKangoRate;
    } else if (selectedCurrencyValue === 'NACHO') {
      calculatedAmount = isKasToSwodn
        ? sendAmount / nachoToSwodnRate
        : sendAmount * swodnToNachoRate;
    } else if (selectedCurrencyValue === 'USDC') {
      calculatedAmount = isKasToSwodn
        ? sendAmount * usdcToSwodnRate // 1 USDC = 500 SWODN (BUY)
        : sendAmount / usdcToSwodnRate; // 500 SWODN = 1 USDC (SELL)
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
        sendInput.value = Math.floor(maxSnowdn / usdcToSwodnRate); // Adjust USDC input for max SWODN
      }
    }

    swodnInput.value = calculatedAmount;
  } else {
    swodnInput.value = '';
  }
}
function updateReverseExchangeValues() {
  const swodnAmount = parseFloat(swodnInput.value);
  let calculatedAmount = 0;

  if (!isNaN(swodnAmount)) {
    if (selectedCurrencyValue === 'KAS') {
      calculatedAmount = isKasToSwodn
        ? Math.floor(swodnAmount / kasToSwodnRate)
        : Math.floor(swodnAmount / swodnToKasRate);
    } else if (selectedCurrencyValue === 'KSDOG') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * ksdogToSwodnBuyRate
        : swodnAmount * ksdogToSwodnSellRate;
    } else if (selectedCurrencyValue === 'KANGO') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * kangoToSwodnRate
        : swodnAmount / swodnToKangoRate;
    } else if (selectedCurrencyValue === 'NACHO') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * nachoToSwodnRate
        : swodnAmount / swodnToNachoRate;
    } else if (selectedCurrencyValue === 'USDC') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount / usdcToSwodnRate // 500 SWODN = 1 USDC (BUY)
        : swodnAmount / usdcToSwodnRate; // 500 SWODN = 1 USDC (SELL)
    }

    // Ensure SWODN is an integer and enforce minimum and maximum limits
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
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / kangoToSwodnRate)
          : Math.floor(maxSnowdn * swodnToKangoRate);
      } else if (selectedCurrencyValue === 'NACHO') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / nachoToSwodnRate)
          : Math.floor(maxSnowdn * swodnToNachoRate);
      } else if (selectedCurrencyValue === 'USDC') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / usdcToSwodnRate)
          : Math.floor(maxSnowdn / usdcToSwodnRate); 
      }
    }

    sendInput.value = calculatedAmount.toFixed(2);
  } else {
    sendInput.value = '';
  }
}

toggleBtn.addEventListener('click', () => {
  isKasToSwodn = !isKasToSwodn;
  updateLabels();
  resetInputs();
});

selectedCurrency.addEventListener("click", () => {
  currencyList.style.display = currencyList.style.display === "block" ? "none" : "block";
});

currencyList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI" || e.target.closest("LI")) {
    let selectedItem = e.target.closest("LI");
    selectedCurrencyValue = selectedItem.dataset.value;
    let currencyIcon = selectedItem.dataset.icon;

    selectedCurrency.innerHTML = `
      <img src="${currencyIcon}" alt="${selectedCurrencyValue} Logo" class="currency-logo" />
      <span>${selectedCurrencyValue}</span>
    `;

    currencyList.style.display = "none";
    updateLabels();
    resetInputs();
  }
});

document.addEventListener("click", (e) => {
  if (!selectedCurrency.contains(e.target) && !currencyList.contains(e.target)) {
    currencyList.style.display = "none";
  }
});

function updateLabels() {
  sendLabel.textContent = isKasToSwodn ? `You Send (${selectedCurrencyValue}):` : `You Send (SNOWDN):`;
  getLabel.textContent = isKasToSwodn ? `You Get (SNOWDN):` : `You Get (${selectedCurrencyValue}):`;
}

function resetInputs() {
  sendInput.value = '';
  swodnInput.value = '';
}

function logTransaction(action, currency, amount) {
  const timestamp = new Date().toLocaleString();
  const logEntry = `Timestamp: ${timestamp}, Action: ${action}, Currency: ${currency}, Amount: ${amount}\n`;

  fetch('/log-transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, currency, amount, timestamp }),
  })
  .then(response => response.text())
  .then(data => {
    console.log('Transaction logged:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

buyBtn.addEventListener('click', () => {
  const amount = swodnInput.value;
  if (amount) {
    logTransaction('Buy', selectedCurrencyValue, amount);
  }
  alert('Redirecting to Treasury wallet page...');
  window.location.href = './buytreasury.html';
});

sellBtn.addEventListener('click', () => {
  const amount = swodnInput.value;
  if (amount) {
    logTransaction('Sell', selectedCurrencyValue, amount);
  }
  alert('Redirecting to Treasury wallet page...');
  window.location.href = './selltreasury.html';
});

updateLabels();