var Averages = function Averages() {
    var SEPARATOR = '.';
    var lastTimestamp;
    var mappings = [
        {dataKey:'averages.oneMinute.direction.average',        uiSelector:'#1min-direction'},
        {dataKey:'averages.oneMinute.speed.average',            uiSelector:'#1min-speed-average'},
        {dataKey:'averages.oneMinute.speed.minimum',            uiSelector:'#1min-speed-min'},
        {dataKey:'averages.oneMinute.speed.maximum',            uiSelector:'#1min-speed-max'},
        {dataKey:'averages.oneMinute.speed.trend.offset',       uiSelector:'#1min-speed-trend-offset'},
        {dataKey:'averages.oneMinute.speed.trend.gradient',     uiSelector:'#1min-speed-trend-gradient'},

        {dataKey:'averages.tenMinutes.direction.average',       uiSelector:'#10min-direction'},
        {dataKey:'averages.tenMinutes.speed.average',           uiSelector:'#10min-speed-average'},
        {dataKey:'averages.tenMinutes.speed.minimum',           uiSelector:'#10min-speed-min'},
        {dataKey:'averages.tenMinutes.speed.maximum',           uiSelector:'#10min-speed-max'},
        {dataKey:'averages.tenMinutes.speed.trend.offset',      uiSelector:'#10min-speed-trend-offset'},
        {dataKey:'averages.tenMinutes.speed.trend.gradient',    uiSelector:'#10min-speed-trend-gradient'}
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

    this.poll = function poll() {
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

};