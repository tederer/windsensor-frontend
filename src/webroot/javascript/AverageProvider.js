$( document ).ready(function() {
    var SEPARATOR = '.';
    var MILLIS_PER_SECOND		= 1000;
    var POLLING_INTERVAL		= 10 * MILLIS_PER_SECOND;

    var lastTimestamp;
    var intervalId;

    var mappings = [
        {dataKey:'averages.oneMinute.direction.average',        uiSelector:'#1min-direction'},
        {dataKey:'averages.oneMinute.speed.average',            uiSelector:'#1min-speed-average'},
        {dataKey:'averages.oneMinute.speed.minimum',            uiSelector:'#1min-speed-min'},
        {dataKey:'averages.oneMinute.speed.maximum',            uiSelector:'#1min-speed-max'},
        {dataKey:'averages.oneMinute.speed.trend.offset',       uiSelector:'#1min-speed-trend-offset'},
        {dataKey:'averages.oneMinute.speed.trend.quotient',     uiSelector:'#1min-speed-trend-quotient'},

        {dataKey:'averages.tenMinutes.direction.average',       uiSelector:'#10min-direction'},
        {dataKey:'averages.tenMinutes.speed.average',           uiSelector:'#10min-speed-average'},
        {dataKey:'averages.tenMinutes.speed.minimum',           uiSelector:'#10min-speed-min'},
        {dataKey:'averages.tenMinutes.speed.maximum',           uiSelector:'#10min-speed-max'},
        {dataKey:'averages.tenMinutes.speed.trend.offset',      uiSelector:'#10min-speed-trend-offset'},
        {dataKey:'averages.tenMinutes.speed.trend.quotient',    uiSelector:'#10min-speed-trend-quotient'}
    ];

    var format = function format(value) {
        var isNumber = (typeof value) === (typeof 1.234);
        if (isNumber) {
            value = Math.round(value * 10) / 10;
        }
        return value;
    };

    var setTimestamp = function setTimestamp(isoTimestamp) {
        var localTimestampAsString = 'n.a.';
        if (isoTimestamp !== undefined) {
            localTimestampAsString = isoTimestamp.toString();
            var timestampInMillis = Date.parse(isoTimestamp);
            if (!Number.isNaN(timestampInMillis)) {
                var locale = (navigator.language !== undefined) ? navigator.language : undefined;
                localTimestampAsString = (new Date(timestampInMillis)).toLocaleString(locale);
            }
        }
        $('#timestamp').text(localTimestampAsString);
    };

    var updateAverages = function updateAverages() {
        $.getJSON( "/averages.json", function( data ) {
            var currentTimestamp = data.averages.timestamp;

            if (lastTimestamp === undefined || lastTimestamp !== currentTimestamp) {
                lastTimestamp = currentTimestamp;

                setTimestamp(currentTimestamp);

                mappings.forEach(mapping => {
                    var keyParts = mapping.dataKey.split(SEPARATOR);
                    var value = data[keyParts[0]];
                    var index = 1;

                    while (index < keyParts.length && (value !== undefined)) {
                        var key = keyParts[index];
                        value = value[key];
                        index++;
                    }

                    var formattedValue = 'n.a.';
                    if (index === keyParts.length) {
                        if(value !== undefined) {
                            formattedValue = format(value);
                        }
                    }
                    $(mapping.uiSelector).text(formattedValue);
                });
            }
        });
    };

    var startPeriodicPolling = function startPeriodicPolling() {
        if (intervalId === undefined) {
            console.log('starting polling ...');
            updateAverages();
            // The following line reduces the time to refresh the averages when the user
            // changes back to the windsensor tab in his/her browser. Without this line 
            // the user has to wait POLLING_INTERVAL milliseconds because of the asynchronuous 
            // nature of http requests.
            window.setTimeout(updateAverages, MILLIS_PER_SECOND);
            intervalId = window.setInterval(updateAverages, POLLING_INTERVAL);
        }
    };

    var stopPeriodicPolling = function stopPeriodicPolling() {
        if (intervalId !== undefined) {
            console.log('stopping polling ...');
            window.clearInterval(intervalId);
            intervalId = undefined;
        }
    };

    var handleVisibilityChange = function handleVisibilityChange(event) {
        if(document.visibilityState === 'hidden') {
            stopPeriodicPolling();
        } else {
            startPeriodicPolling();
        }
    };

    if (document.visibilityState !== undefined) {
        $(document).on('visibilitychange', handleVisibilityChange);
        $(window).on('beforeunload', () => {
            $(document).off('visibilitychange', handleVisibilityChange);
        });
    }
    
    startPeriodicPolling();
});