var MILLIS_PER_SECOND = 1000;
var POLLING_INTERVAL  = 10 * MILLIS_PER_SECOND;

var intervalId;
var averages;
var windHistory;

$( document ).ready(function() {
    
    averages     = new Averages();
    windHistory  = new History();

    var pollData = function pollData() {
        averages.poll();
        windHistory.poll();
    };

    var startPeriodicPolling = function startPeriodicPolling() {
        if (intervalId === undefined) {
            console.log('starting polling ...');
            pollData();
            // The following line reduces the time to refresh the averages when the user
            // changes back to the windsensor tab in his/her browser. Without this line 
            // the user has to wait POLLING_INTERVAL milliseconds because of the asynchronuous 
            // nature of http requests.
            window.setTimeout(pollData, MILLIS_PER_SECOND);
            intervalId = window.setInterval(pollData, POLLING_INTERVAL);
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