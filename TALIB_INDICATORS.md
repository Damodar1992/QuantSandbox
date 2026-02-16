# 📊 TA-Lib Indicators Reference

## Обзор

Все индикаторы теперь полностью совместимы с **TA-Lib (Technical Analysis Library)** - стандартной библиотекой для технического анализа.

## ✅ Доступные индикаторы (12 шт.)

### 1. RSI - Relative Strength Index
**TA-Lib функция:** `RSI`

**Параметры:**
- `timeperiod` (2-100, default: 14)

**Описание:** Momentum oscillator measuring speed and magnitude of price changes

**Метрики:**
- Overbought/Oversold Detection
- Divergence Quality  
- Momentum Strength

**Пример использования:**
```python
# TA-Lib
rsi = talib.RSI(close, timeperiod=14)

# В формулах:
IF RSI < 30 THEN BUY
IF RSI > 70 THEN SELL
```

---

### 2. EMA - Exponential Moving Average
**TA-Lib функция:** `EMA`

**Параметры:**
- `timeperiod` (2-200, default: 30)

**Описание:** Moving average giving more weight to recent prices

**Метрики:**
- Trend Direction
- Support/Resistance
- Lag Reduction

**Пример использования:**
```python
# TA-Lib
ema = talib.EMA(close, timeperiod=30)

# В формулах:
IF Close > EMA THEN BUY
IF Close < EMA THEN SELL
```

---

### 3. SMA - Simple Moving Average
**TA-Lib функция:** `SMA`

**Параметры:**
- `timeperiod` (2-200, default: 30)

**Описание:** Arithmetic mean of prices over a specified period

**Метрики:**
- Trend Direction
- Support/Resistance
- Price Smoothing

**Пример использования:**
```python
# TA-Lib
sma = talib.SMA(close, timeperiod=30)

# В формулах:
IF Close > SMA AND Volume > 1000000 THEN BUY
```

---

### 4. MACD - Moving Average Convergence/Divergence
**TA-Lib функция:** `MACD`

**Параметры:**
- `fastperiod` (2-50, default: 12)
- `slowperiod` (5-100, default: 26)
- `signalperiod` (2-50, default: 9)

**Описание:** Trend-following momentum indicator showing relationship between two MAs

**Метрики:**
- Trend Momentum
- Crossover Signals
- Divergence Detection

**Пример использования:**
```python
# TA-Lib
macd, signal, hist = talib.MACD(close, 
                                  fastperiod=12, 
                                  slowperiod=26, 
                                  signalperiod=9)

# В формулах:
IF MACD > MACD_signal THEN BUY
IF MACD < MACD_signal THEN SELL
```

---

### 5. BBANDS - Bollinger Bands
**TA-Lib функция:** `BBANDS`

**Параметры:**
- `timeperiod` (2-100, default: 5)
- `nbdevup` (0.5-5, default: 2) - верхнее отклонение
- `nbdevdn` (0.5-5, default: 2) - нижнее отклонение
- `matype` (0-8, default: 0) - тип MA

**MA Types:**
- 0 = SMA (Simple Moving Average)
- 1 = EMA (Exponential Moving Average)
- 2 = WMA (Weighted Moving Average)
- 3 = DEMA (Double Exponential MA)
- 4 = TEMA (Triple Exponential MA)
- 5 = TRIMA (Triangular MA)
- 6 = KAMA (Kaufman Adaptive MA)
- 7 = MAMA (MESA Adaptive MA)
- 8 = T3 (Triple Exponential MA)

**Описание:** Volatility bands placed above and below a moving average

**Метрики:**
- Volatility
- Overbought/Oversold
- Price Breakouts

**Пример использования:**
```python
# TA-Lib
upper, middle, lower = talib.BBANDS(close, 
                                     timeperiod=5,
                                     nbdevup=2,
                                     nbdevdn=2,
                                     matype=0)

# В формулах:
IF Close < BBANDS_lower THEN BUY
IF Close > BBANDS_upper THEN SELL
```

---

### 6. STOCH - Stochastic Oscillator
**TA-Lib функция:** `STOCH`

**Параметры:**
- `fastk_period` (1-50, default: 5)
- `slowk_period` (1-50, default: 3)
- `slowk_matype` (0-8, default: 0)
- `slowd_period` (1-50, default: 3)
- `slowd_matype` (0-8, default: 0)

**Описание:** Momentum indicator comparing closing price to price range over time

**Метрики:**
- Overbought/Oversold
- Momentum
- Divergence

**Пример использования:**
```python
# TA-Lib
slowk, slowd = talib.STOCH(high, low, close,
                           fastk_period=5,
                           slowk_period=3,
                           slowk_matype=0,
                           slowd_period=3,
                           slowd_matype=0)

# В формулах:
IF STOCH_slowk < 20 AND STOCH_slowd < 20 THEN BUY
IF STOCH_slowk > 80 AND STOCH_slowd > 80 THEN SELL
```

---

### 7. ATR - Average True Range
**TA-Lib функция:** `ATR`

**Параметры:**
- `timeperiod` (1-100, default: 14)

**Описание:** Volatility indicator measuring degree of price volatility

**Метрики:**
- Volatility
- Stop-Loss Placement
- Position Sizing

**Пример использования:**
```python
# TA-Lib
atr = talib.ATR(high, low, close, timeperiod=14)

# В формулах:
# Используется для динамических stop-loss
IF ATR > ATR_threshold THEN REDUCE_POSITION_SIZE
```

---

### 8. ADX - Average Directional Movement Index
**TA-Lib функция:** `ADX`

**Параметры:**
- `timeperiod` (2-100, default: 14)

**Описание:** Trend strength indicator regardless of direction

**Метрики:**
- Trend Strength
- Directional Movement
- Trend Confirmation

**Пример использования:**
```python
# TA-Lib
adx = talib.ADX(high, low, close, timeperiod=14)

# В формулах:
IF ADX > 25 AND Close > EMA THEN BUY  # Strong uptrend
IF ADX < 20 THEN NO_TRADE  # Weak trend
```

---

### 9. CCI - Commodity Channel Index
**TA-Lib функция:** `CCI`

**Параметры:**
- `timeperiod` (2-100, default: 14)

**Описание:** Momentum oscillator measuring deviation from average price

**Метрики:**
- Overbought/Oversold
- Trend Reversals
- Divergence

**Пример использования:**
```python
# TA-Lib
cci = talib.CCI(high, low, close, timeperiod=14)

# В формулах:
IF CCI < -100 THEN BUY  # Oversold
IF CCI > 100 THEN SELL  # Overbought
```

---

### 10. MFI - Money Flow Index
**TA-Lib функция:** `MFI`

**Параметры:**
- `timeperiod` (2-100, default: 14)

**Описание:** Momentum indicator incorporating volume and price (Volume-weighted RSI)

**Метрики:**
- Volume-Weighted RSI
- Overbought/Oversold
- Money Flow

**Пример использования:**
```python
# TA-Lib
mfi = talib.MFI(high, low, close, volume, timeperiod=14)

# В формулах:
IF MFI < 20 THEN BUY  # Oversold with volume confirmation
IF MFI > 80 THEN SELL  # Overbought with volume confirmation
```

---

### 11. WILLR - Williams %R
**TA-Lib функция:** `WILLR`

**Параметры:**
- `timeperiod` (2-100, default: 14)

**Описание:** Momentum indicator measuring overbought/oversold levels

**Метрики:**
- Overbought/Oversold
- Momentum
- Entry/Exit Signals

**Пример использования:**
```python
# TA-Lib
willr = talib.WILLR(high, low, close, timeperiod=14)

# В формулах:
IF WILLR < -80 THEN BUY  # Oversold
IF WILLR > -20 THEN SELL  # Overbought
```

---

### 12. SAR - Parabolic SAR
**TA-Lib функция:** `SAR`

**Параметры:**
- `acceleration` (0.01-0.2, default: 0.02)
- `maximum` (0.1-1, default: 0.2)

**Описание:** Trend-following indicator providing entry/exit points

**Метрики:**
- Trend Direction
- Stop-Loss
- Trend Reversal

**Пример использования:**
```python
# TA-Lib
sar = talib.SAR(high, low, acceleration=0.02, maximum=0.2)

# В формулах:
IF Close > SAR THEN BUY  # Price above SAR = uptrend
IF Close < SAR THEN SELL  # Price below SAR = downtrend
```

---

## 📝 Source Options (для всех индикаторов)

Все индикаторы поддерживают выбор источника данных:

- **Close** - цена закрытия (default для большинства)
- **Open** - цена открытия
- **High** - максимум
- **Low** - минимум
- **HL/2** - (High + Low) / 2
- **HLC/3** - (High + Low + Close) / 3
- **OHLC/4** - (Open + High + Low + Close) / 4

---

## 🔧 Параметры оптимизации

Для каждого параметра индикатора можно задать:

- **Default** - значение по умолчанию
- **Min** - минимальное значение для оптимизации
- **Max** - максимальное значение для оптимизации
- **Step** - шаг изменения

**Пример:**
```
RSI:
├─ timeperiod
│  ├─ Default: 14
│  ├─ Min: 10
│  ├─ Max: 20
│  └─ Step: 1
└─ Source: Close

Оптимизация протестирует: 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
```

---

## 💡 Рекомендации по параметрам

### Для краткосрочных стратегий (5m-15m):
```
RSI: timeperiod = 9-14
EMA: timeperiod = 9-21
MACD: fast=8, slow=17, signal=9
BBANDS: timeperiod = 20, nbdevup/dn = 2
```

### Для среднесрочных (1h-4h):
```
RSI: timeperiod = 14-21
EMA: timeperiod = 20-50
MACD: fast=12, slow=26, signal=9 (классика)
BBANDS: timeperiod = 20, nbdevup/dn = 2
```

### Для долгосрочных (1d+):
```
RSI: timeperiod = 14-28
EMA: timeperiod = 50-200
MACD: fast=12, slow=26, signal=9
BBANDS: timeperiod = 20, nbdevup/dn = 2-3
```

---

## 🎯 Комбинации индикаторов

### Trend Following:
```
EMA (20) + MACD (12,26,9) + ADX (14)

IF EMA_20 > EMA_50 AND MACD > MACD_signal AND ADX > 25 THEN BUY
```

### Mean Reversion:
```
RSI (14) + BBANDS (20,2,2) + MFI (14)

IF RSI < 30 AND Close < BBANDS_lower AND MFI < 20 THEN BUY
```

### Momentum:
```
MACD (12,26,9) + STOCH (5,3,3) + CCI (14)

IF MACD > 0 AND STOCH_slowk > 50 AND CCI > 0 THEN BUY
```

---

## 📚 Ссылки на TA-Lib документацию

**Официальная документация:**
- [TA-Lib Official](https://ta-lib.org/)
- [TA-Lib Python Wrapper](https://github.com/mrjbq7/ta-lib)
- [Function List](https://ta-lib.org/function.html)

**Установка TA-Lib (Python):**
```bash
# macOS
brew install ta-lib
pip install TA-Lib

# Ubuntu/Debian
sudo apt-get install ta-lib
pip install TA-Lib

# Windows
# Download from https://www.lfd.uci.edu/~gohlke/pythonlibs/#ta-lib
pip install TA_Lib‑0.4.XX‑cpXX‑cpXX‑win_amd64.whl
```

---

## ✅ Совместимость

Все параметры индикаторов в приложении **полностью совместимы** с TA-Lib:

- ✅ Названия параметров соответствуют TA-Lib
- ✅ Диапазоны значений корректны
- ✅ Дефолтные значения соответствуют стандарту
- ✅ Поддержка MA Types (0-8) для BBANDS и STOCH
- ✅ Возможность экспорта в Python с TA-Lib

---

## 🔄 Миграция кода

**Из приложения в Python:**

```python
# Настройки из приложения:
# RSI: timeperiod=14, source=Close

# Код Python:
import talib
import pandas as pd

# Загрузка данных
df = pd.read_csv('prices.csv')

# Применение индикатора
rsi = talib.RSI(df['Close'], timeperiod=14)

# Использование в стратегии
buy_signal = (rsi < 30)
sell_signal = (rsi > 70)
```

---

**Версия:** v0.2.2  
**Дата:** 2026-01-26  
**Автор:** bogdan
