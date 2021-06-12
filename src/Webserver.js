/* global windsensor, process */
require('./logging/LoggingSystem.js');
require('./Version.js');

var LOGGER 					= windsensor.logging.LoggingSystem.createLogger('Webserver');
var WEB_ROOT_FOLDER			= 'webroot';
var MILLIS_PER_SECOND		= 1000;
var POLLING_INTERVAL		= 10 * MILLIS_PER_SECOND;
var STOP_POLLING_TIMEOUT	= 30 * MILLIS_PER_SECOND;
var DEFAULT_PORT			= 80;

var fs 						= require('fs');
var express 				= require('express');
var https					= require('https');
var configuredlogLevel		= process.env.LOG_LEVEL;
var sensorUrl				= process.env.SENSOR_URL;
var sensorId				= process.env.SENSOR_ID;
var webserverPort			= process.env.WEBSERVER_PORT;
var app						= express();
var windAverages;
var windHistory;
var intervalId;
var stopPollingTimeoutId;

var logLevel = windsensor.logging.Level.INFO;
if (configuredlogLevel !== undefined && windsensor.logging.Level[configuredlogLevel] !== undefined) {
	logLevel = windsensor.logging.Level[configuredlogLevel];
}
windsensor.logging.LoggingSystem.setMinLogLevel(logLevel);
LOGGER.logInfo('log level = ' + logLevel.description);

var info = {
    version:    windsensor.getVersion(),
    start:      (new Date()).toISOString()
};

if (typeof info.version === 'string') {
    LOGGER.logInfo('version = ' + info.version);
} else {
    LOGGER.logError('failed to evaluate version: ' + info.version.message);
}

var assertValidSensorUrl = function assertValidSensorUrl() {
	if (sensorUrl === undefined || sensorUrl.length == 0) {
		LOGGER.logError('No sensor URL configured! Please provide it via the environment variable called SENSOR_URL.');
		process.exit(1);
	}
};

var assertValidSensorId = function assertValidSensorId() {
    if (sensorId === undefined) {
        LOGGER.logError('No sensor ID configured! Please provide it via the environment variable called SENSOR_ID.');
        process.exit(1);
    }
    if (sensorId.match(/^[1-9][0-9]{4}$/) === null) {
        LOGGER.logError('Wrong format of sensor ID "' + sensorId + '". Expected format = [1-9][0-9]{5}');
        process.exit(1);
    }
};

var logRequest = function logRequest(request,response, next) {
	LOGGER.logDebug(() => '\nREQUEST for "' + request.url + '" received');
	next();
};
 
var replaceSpacesInRequestUrlByEscapeSequence = function replaceSpacesInRequestUrlByEscapeSequence(request,response, next) {
	request.url = request.url.replace(/%20/g, ' ');
	next();
};

var sendInternalServerError = function sendInternalServerError(response, text) {
	response.writeHeader(500, {'Content-Type': 'text/plain'});  
	response.write(text);  
	response.end();
};
 
var handleFileRequests = function handleFileRequests(request, response) {
	var requestedDocumentUrl = request.url;
	var absolutePathOfRequest = WEB_ROOT_FOLDER + requestedDocumentUrl;
	
	LOGGER.logInfo('request for ' + requestedDocumentUrl);
	  
	if (!fs.existsSync(absolutePathOfRequest)) {   
		LOGGER.logInfo(absolutePathOfRequest + ' does not exist -> sending internal server error');
		sendInternalServerError(response, 'file ' + absolutePathOfRequest + ' does not exist');
	} else {
		LOGGER.logInfo('returning ' + absolutePathOfRequest);
		response.sendFile(requestedDocumentUrl, { root: WEB_ROOT_FOLDER } );
	}
};

var pollData = function pollData() {
	pollAverages();
	pollHistory();
};

var startPeriodicPolling = function startPeriodicPolling() {
	if (intervalId === undefined) {
		LOGGER.logInfo('starting polling ...');
		pollData();
		intervalId = setInterval(pollData, POLLING_INTERVAL);
	}
};

var stopPeriodicPolling = function stopPeriodicPolling() {
	if (intervalId !== undefined) {
		LOGGER.logInfo('stopping polling ...');
		clearInterval(intervalId);
		intervalId = undefined;
	}
};

var stopPollingTimeoutExpired = function stopPollingTimeoutExpired() {
	LOGGER.logInfo('no request received for ' + STOP_POLLING_TIMEOUT + 'ms -> polling not longer needed ...');
	stopPeriodicPolling();
	stopPollingTimeoutId = undefined;
};

var restartStopPollingTimeout = function restartStopPollingTimeout() {
	if (stopPollingTimeoutId !== undefined) {
		clearTimeout(stopPollingTimeoutId);
	}
	stopPollingTimeoutId = setTimeout(stopPollingTimeoutExpired, STOP_POLLING_TIMEOUT);
};

var handleAveragesRequest = function handleAveragesRequest(request, response) {
	LOGGER.logDebug(() => 'request for average values');
	restartStopPollingTimeout();
	startPeriodicPolling();
	response.json(windAverages);
};

var handleHistoryRequest = function handleHistoryRequest(request, response) {
	LOGGER.logDebug(() => 'request for history values');
	restartStopPollingTimeout();
	startPeriodicPolling();
	response.json(windHistory);
};

var pollAverages = function pollAverages() {
	var url = sensorUrl + '/windsensor/' + sensorId;
	poll(url, data => windAverages = data, 'averages');
};

var pollHistory = function pollHistory() {
	var url = sensorUrl + '/windsensor/history/' + sensorId;
	poll(url, data => windHistory = data, 'history');
};

var poll = function poll(url, consumerCallback, description) {
	LOGGER.logDebug('polling ' + description + ' ...');
	var request = https.get(url, (response) => {
		if (response.statusCode !== 200) {
			LOGGER.logError('failed to poll "' + url + '" [statusCode=' + response.statusCode + ', statusMessage=' + response.statusMessage + ']');
		} else {
			var rawData = '';
			response.setEncoding('utf8');
			response.on('error', (error) => LOGGER.logError('failed to poll ' + description + ': ' + error.toString()));
			response.on('data', (chunk) => rawData += chunk);
			response.on('end', (chunk) => {
				try {
					consumerCallback(JSON.parse(rawData));
					LOGGER.logInfo('polled ' + description + ' successfully');
				} catch(e) {
					LOGGER.logError('failed to parse "' + rawData + '" because of ' + e.toString());
				}
			});
		}
	});

	request.on('error', (error) => LOGGER.logError('failed to poll averages: ' + error.toString()));
};

assertValidSensorUrl();
assertValidSensorId();
LOGGER.logInfo('sensor URL = ' + sensorUrl);
LOGGER.logInfo('sensor ID  = ' + sensorId);

app.get('/averages.json', handleAveragesRequest);
app.get('/history.json', handleHistoryRequest);

app.get(/\/info/, (request, response) => {
    var path = request.path;
    LOGGER.logDebug('GET request [path: ' + path + ']');
    response.status(200).json(info);
});

app.get('*', replaceSpacesInRequestUrlByEscapeSequence);
app.get('*', logRequest);
app.get('*', handleFileRequests );

var port = webserverPort === undefined ? DEFAULT_PORT : webserverPort;

app.listen(port, () => {
	LOGGER.logInfo('frontend server listening on port ' + port);
});
