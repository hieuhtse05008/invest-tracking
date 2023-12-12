function setState(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

function getState(key) {
    return JSON.parse(localStorage.getItem(key));
}

const money = (x) => {
    return Math.floor(x * 10000) / 10000;
}

// const cryptoSet = new Map();

const apiKey = "qbGax0cTDvP0nXDl11";
const apiSecret = (data = "") => {
    return CryptoJS.HmacSHA256(data, "ynJaZqQrjDLERqqeJAeKq3yaiRFAI81FHYNa")
        .toString(CryptoJS.enc.Hex);

}

const bybitWs = () => {
    // let endpoint = "wss://stream.bybit.com/v5/private";
    const ids = [...app._instance.data.cryptoSet.keys()].filter(e => e !== "USDT").map(e => {
        return `tickers.${e}USDT`;
    });
    const chunks = [[]];
    while (ids.length) {
        if (chunks[chunks.length - 1].length >= 10) {
            chunks.push([]);
        }
        chunks[chunks.length - 1].push(ids.pop());
    }
    console.log("chunks", chunks);
    let endpoint = "wss://stream.bybit.com/v5/public/spot";
    console.log('Attempting to connect to WebSocket ', endpoint);
    let cli = new WebSocket(endpoint);

    cli.onopen = function () {
        console.log('WebSocket cli Connected');
        // const signature = crypto.createHmac("sha256", apiSecret).update("GET/realtime" + expires).digest("hex");
        // const signature = CryptoJS.HmacSHA256("GET/realtime" + expires,apiSecret).toString(CryptoJS.enc.Hex);

        // const expires = new Date().getTime() + 10000;
        // cli.send(JSON.stringify({
        //     op: "auth",
        //     args: [
        //         apiKey, expires.toFixed(0),
        //         CryptoJS.HmacSHA256("GET/realtime" + expires, "ynJaZqQrjDLERqqeJAeKq3yaiRFAI81FHYNa")
        //             .toString(CryptoJS.enc.Hex)
        //
        //     ],
        // }));


        // WALLET
        // cli.send(JSON.stringify({"op": "subscribe", "args": ["wallet"]}));

        // PUBLIC PRICES
        chunks.forEach(chunk => {
            cli.send(JSON.stringify({
                "op": "subscribe", "args": chunk
                // ["tickers.BTCUSDT","tickers.WLDUSDT",]
            }));
        });

    }

    cli.onmessage = function (data) {
        let res
        try {
            res = JSON.parse(data.data).data;

            const symbol = res.symbol.replaceAll("USDT", "");
            // console.log(res);
            app._instance.data.cryptoSet.set(symbol, {
                ...app._instance.data.cryptoSet.get(symbol),
                ...res,
                symbol,
            });
            // console.log(app._instance.data.cryptoSet);
        } catch (ex) {
            console.log("EXXXXXXX", res, data, JSON.parse(data.data));
        }
    }
    return cli;
}
const cmcWs = () => {
    console.log("CMC", cryptoSet.keys())
    const cmcIds = [...cryptoSet.keys()].filter(e => cmcCoins.filter(cmc => cmc.symbol === e).length).map(e => {
        const i = cmcCoins.filter(cmc => cmc.symbol === e)[0];
        console.log(e, i);
        return i.id;
    }).join(',');
    let endpoint = "wss://push.coinmarketcap.com/ws?device=web&client_source=home_page";
    console.log('Attempting to connect to WebSocket ', endpoint);
    console.log('Attempting to connect to WebSocket ', cmcIds);
    let cli = new WebSocket(endpoint);
    cli.onopen = function () {
        console.log('WebSocket cli Connected');

        // PUBLIC PRICES
        cli.send(JSON.stringify({
            "method": "RSUBSCRIPTION",
            "params": [
                "main-site@crypto_price_5s@{}@normal", cmcIds
                // "1,1027,825,1839,52,5426,3408,2010,74,1958,1975,11419,5805,3890,6636,3717,4943,2,5994,1831,3957,3794,3897,512,2563,20396,7083,328,1321,3635,2280,4642,8000,6535,8916,21794,4157,4687,10603,11840,3077,27075,7226,1518,11841,7278,6719,5690,3155,6892,4195,4030,2586,4558,2416,3602,22861,3513,4847,6783,6210,2011,1966,1765,1376,11092,4846,2634,19891,2087,26081,8646,7080,11156,7186,4066,5632,10791,1720,6953,4256,2943,7334,20947,1785,6538,18876,24478,5964,5176,7653,11857,2502,1437,25028,16086,1659,4705,3330,4172,1,1027,2010,1839,6636,52,1975,2,512,1831,7083,74,9023,9022,5824,6783"

            ]
        }));
    }

    cli.onmessage = function (data) {
        console.log(JSON.parse(data.data));
    }
    return cli;
}
// bybitWs();
const {createApp} = Vue
const defaultTabs = {
    bybit: {
        key: 'bybit', name: 'Bybit',
        balance: 0, items: []
    },
}

const app = createApp({
    mounted() {
        // window.addEventListener('keydown', (e) => {
        //     if (e.key == "ArrowRight") {
        //         this.next();
        //     }
        // });
        this.loadDataBybit();
    },
    computed: {
        getItems() {
            if (!this.currentTab) return [];
            const col = this.columns.filter(e=>e.key===this.sort)[0];
            return this.cexs[this.currentTab.key].items.sort((a, b) => {
                const x = Number.parseFloat(col.get(a));
                const y = Number.parseFloat(col.get(b));

                return (this.sortDesc ? (x > y) : x < y) ? 1 : -1;
            });
        }
    },
    methods: {
        loadDataBybit() {
            const cex = "bybit";
            this.isLoading[cex] = true;
            const tt = new Date().getTime();
            const params = "accountType=UNIFIED";
            const url = `https://api.bybit.com/v5/account/wallet-balance?${params}`;
            const _t = this;
            $.ajax({
                url,
                type: "GET",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-BAPI-SIGN", apiSecret(tt + apiKey + 50000 + params));
                    xhr.setRequestHeader("X-BAPI-API-KEY", apiKey);
                    xhr.setRequestHeader("X-BAPI-TIMESTAMP", tt);
                    xhr.setRequestHeader("X-BAPI-RECV-WINDOW", 50000);
                },
                success: function (e) {
                    console.log("success", e);
                    const data = e.result.list[0].coin.map(e => {
                        return {
                            symbol: e.coin,
                            balance: e.equity,
                            value: e.usdValue,
                            lastPrice: e.usdValue/e.equity,
                            highPrice24h: e.usdValue/e.equity,
                            lowPrice24h: e.usdValue/e.equity,
                            prevPrice24h: e.usdValue/e.equity,
                            volume24h: e.usdValue/e.equity,
                            turnover24h: e.usdValue/e.equity,
                        };
                    });
                    data.forEach(item => {
                        _t.cryptoSet.set(item.symbol, item);
                    });
                    _t.cexs[cex] = {
                        ..._t.cexs[cex],
                        balance: e.result.list[0].totalWalletBalance,
                        items: data,
                    }

                    _t.isLoading[cex] = false;

                    _t.activeTab(cex);
                    bybitWs();
                    // cmcWs();
                }
            });



            const recvWindow = 30000;
            const ts = Date.now();
            const sig = CryptoJS.HmacSHA256(`timestamp=${ts}&recvWindow=${recvWindow}`, "0b6d7c6a7700452e836f95aaaed2cf56")
                .toString(CryptoJS.enc.Hex);
            $.ajax({
                url:`https://api.mexc.com/api/v3/capital/config/getall?timestamp=${ts}&recvWindow=${recvWindow}&signature=${sig}`,
                type: "GET",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("X-MEXC-APIKEY", "mx0vglNsDt2LD1L4JJ");
                },
                success: function (e) {
                    console.log("success", e);

                }
            });
        },
        money,
        setCex(cex, data) {
            this.cexs[cex] = data;
        },
        sortByCol(col) {
            console.log("sortByCol", col)
            if (["stt", "symbol"].includes(col)) return;
            if (col === this.sort) this.sortDesc = !this.sortDesc;
            else this.sortDesc = true;
            this.sort = col;
        },
        activeTab(tab) {
            console.log(this.currentTab, tab);
            console.log(this.cexs);
            this.currentTab = this.cexs[tab];
        },

    },
    data() {
        return {
            currentTab: null,
            cryptoSet: new Map(),
            cexs: defaultTabs,
            isLoading: {},
            sort: "symbol",
            sortDesc: true,
            columns: [
                {key: "stt", name: "STT", get: (e, i) => i + 1},
                {key: "symbol", name: "Token", get: (e, i) => e.symbol},
                {key: "balance", name: "Balance", get: (e, i) => money(e.balance)},
                // {key: "value", name: "Value", get: (e, i) => money(e.value) + "$"},
                {
                    key: "live", name: "Value", get: (e, i) => {
                        const item = this.cryptoSet.get(e.symbol);
                        return money(item && item.lastPrice ? e.balance * item.lastPrice : e.value) + "$";
                    }
                },
                {
                    key: "price", name: "Price", get: (e, i) => {
                        const item = this.cryptoSet.get(e.symbol);
                        return (item && item.lastPrice ? item.lastPrice : e.value/e.balance) + "$";
                    }
                },
                {
                    key: "change24h", name: "Change 24h",
                    className: (e)=>{
                        const item = this.cryptoSet.get(e.symbol);
                        const prev24h = item && item.prevPrice24h ? item.prevPrice24h : e.value/e.balance;
                        const current = item && item.lastPrice ? item.lastPrice : e.value/e.balance;
                        return money((current-prev24h)/prev24h*100) > 0 ? "btn btn-sm btn-success" : "btn btn-sm btn-danger";
                    },
                    get: (e, i) => {
                        const item = this.cryptoSet.get(e.symbol);
                        const prev24h = item && item.prevPrice24h ? item.prevPrice24h : e.value/e.balance;
                        const current = item && item.lastPrice ? item.lastPrice : e.value/e.balance;
                        return money((current-prev24h)/prev24h*100) + "%";
                    }
                },
            ]
        }
    }
});
app.mount('#app');
