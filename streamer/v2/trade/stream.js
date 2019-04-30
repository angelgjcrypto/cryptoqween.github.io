var streamUrl = "ws://localhost:7000";
var fsym = "BTC";
var tsym = "USD";
var currentSubs;
var currentSubsText = "";
var dataUrl = "https://min-api.cryptocompare.com/data/subs?fsym=" + fsym + "&tsyms=" + tsym;
var socket = new WebSocket(streamUrl);

function connect() {
    socket.onopen = function() {
        $.getJSON(dataUrl, function(data) {
            currentSubs = data['USD']['TRADES'];
            console.log(currentSubs);
            for (var i = 0; i < currentSubs.length; i++) {
                currentSubsText += currentSubs[i] + ", ";
            }
            $('#sub-exchanges').text(currentSubsText);

            var objectToSend = {
                t:'SubAdd',
                subs:currentSubs
            };

            socket.send(JSON.stringify(objectToSend));
        });
    }

    socket.onmessage = function(currentData) {
        const message = currentData.data;
        console.log(message);
        var tradeField = message.substr(0, message.indexOf("~"));
        if (tradeField == CCC.STATIC.TYPE.TRADE) {
            transformData(message);
        }
    };

    socket.onerror = function(error) {
        console.log(error);
    }
}

var transformData = function(data) {
	var coinfsym = CCC.STATIC.CURRENCY.getSymbol(fsym);
	var cointsym = CCC.STATIC.CURRENCY.getSymbol(tsym)
	var incomingTrade = CCC.TRADE.unpack(data);
	var newTrade = {
		Market: incomingTrade['M'],
		Type: incomingTrade['T'],
		ID: incomingTrade['ID'],
		Price: CCC.convertValueToDisplay(cointsym, incomingTrade['P']),
		Quantity: CCC.convertValueToDisplay(coinfsym, incomingTrade['Q']),
		Total: CCC.convertValueToDisplay(cointsym, incomingTrade['TOTAL'])
	};

	if (incomingTrade['F'] & 1) {
		newTrade['Type'] = "SELL";
	}
	else if (incomingTrade['F'] & 2) {
		newTrade['Type'] = "BUY";
	}
	else {
		newTrade['Type'] = "UNKNOWN";
	}

	displayData(newTrade);
};

var displayData = function(dataUnpacked) {
	var maxTableSize = 30;
	var length = $('table tr').length;
	$('#trades').after(
		"<tr class=" + dataUnpacked.Type + "><th>" + dataUnpacked.Market + "</th><th>" + dataUnpacked.Type + "</th><th>" + dataUnpacked.ID + "</th><th>" + dataUnpacked.Price + "</th><th>" + dataUnpacked.Quantity + "</th><th>" + dataUnpacked.Total + "</th></tr>"
	);

	if (length >= (maxTableSize)) {
		$('table tr:last').remove();
	}
};

$('#unsubscribe').click(function() {
	console.log('Unsubscribing to streamers');
	$('#subscribe').removeClass('subon');
	$(this).addClass('subon');
	$('#stream-text').text('Stream stopped');

    var objectToSend = {
        t:'SubRemove',
        subs:currentSubs
    };
    socket.send(JSON.stringify(objectToSend));

	$('#sub-exchanges').text("");
});

$('#subscribe').click(function() {
	$('#unsubscribe').removeClass('subon');
	$(this).addClass('subon');
	$('#stream-text').text("Streaming...");
    
    if (socket.readyState !== 1) {
        socket = new WebSocket(streamUrl);
        connect();
    }

    var objectToSend = {
        t:'SubAdd',
        subs:currentSubs
    };
	console.log('Subscribing to streamers')
    socket.send(JSON.stringify(objectToSend));
	$('#sub-exchanges').text(currentSubsText);
});

connect();