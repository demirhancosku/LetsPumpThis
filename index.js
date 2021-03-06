const Bittrex = require('node-bittrex-api');
const Sleep = require('sleep');
const Prompt = require('prompt');


//remove this line and update API_KEY & SECRET
const config = require('./config');

const API_KEY = config.api_key;
const SECRET = config.api_secret;

let multip = 1.5; // This value will be multiply with last ask price for buy order
let BTCAmount = config.amount;

Bittrex.options({
    'apikey': API_KEY,
    'apisecret': SECRET,
});

let symbol;

Prompt.start();
Prompt.get(['symbol'], function (err, result) {

    if(result.symbol === undefined){
        return;
    }

    symbol = result.symbol.toUpperCase();

    console.log('Symbol input:' + symbol);

    /**
     * Check Price
     */
    Bittrex.getticker({market: 'BTC-' + symbol}, function (ticker) {

        console.log(ticker.result);

        let bid = ticker.result.Ask;

        let buy = bid * multip;
        let sell = bid * 1.9;

        console.log('We will buy until: ' + buy);
        console.log('We will sell at: ' + sell);

        let quantity = parseInt(BTCAmount / buy) - 1;
        console.log(' Calculated amount:' + quantity);

        /**
         * Buy
         */
        Bittrex.tradebuy({
            MarketName: 'BTC-' + symbol,
            OrderType: 'LIMIT',
            Quantity: quantity,
            Rate: buy,
            TimeInEffect: 'GOOD_TIL_CANCELLED',
            ConditionType: 'LESS_THAN',
            Target: buy
        }, function (data, err) {


            if (data !== null) {
                console.log('BUY:');
                console.log(data.result);

                /**
                 * Balance check
                 */

                checkBalanceAndSell(symbol, sell);

            } else {
                console.log('Cant buy');
                console.log(err);
            }

        });

    });


});


function checkBalanceAndSell(symbol, sell) {

    Sleep.sleep(1);
    Bittrex.getbalance({currency: symbol}, function (result, err) {

        console.log('Balance:');
        let balance = result.result;
        console.log(balance);

        if (err) {
            console.log('Balance ERR');
            console.log(err);
        }

        if (balance.Balance === 0) {
            console.log('Check Again');
            checkBalanceAndSell(symbol, sell);
        } else {

            Bittrex.tradesell({
                MarketName: 'BTC-' + symbol,
                OrderType: 'LIMIT',
                Quantity: balance.Balance,
                Rate: sell,
                TimeInEffect: 'GOOD_TIL_CANCELLED',
                ConditionType: 'GREATER_THAN',
                Target: sell
            }, function (data, err) {
                console.log('SELL:');
                console.log(data.result);

                checkBalanceAndSell(symbol, sell);

                if (err) {
                    console.log('Sell ERR');
                    console.log(err);
                }
            });
        }

    });
}