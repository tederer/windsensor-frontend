var History = function Histroy() {
    var lastTimestamp;
    var chart = new Windchart();

    this.poll = function poll() {
        $.getJSON( "/history.json", function( data ) {
            var samples = data.twoHoursHistory.data;
            var currentTimestamp = (samples.length > 0) ? samples[samples.length - 1].timestamp : undefined;

            if (lastTimestamp === undefined || lastTimestamp !== currentTimestamp) {
               lastTimestamp = currentTimestamp;

               chart.display(data);
            }
        });
    }
}