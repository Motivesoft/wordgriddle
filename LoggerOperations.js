function formatMessage(source, level, message) {
    return `${new Date().toISOString()} : ${source} : ${level} : ${message}`;
}

function logToConsole(source, level, message) {
    const logEntry = formatMessage(source, level, message);
    console.log(logEntry);
}

function logToFile(source, level, message) {
    const logEntry = formatMessage(source, level, message) + `\n`;
    // Save log data to a file (or process it as needed)
    // fs.appendFile(path.join(__dirname, 'logs.txt'), logEntry, (err) => {
    //     if (err) {
    //         console.error('Failed to write log:', err);
    //         throw err;
    //     }
    // });
}

function logClient(level, message) {
    logToConsole('client', level, message);
}

function logServer(level, message) {
    logToConsole('server', level, message);
}

function logLog(...args) {
    logServer('LOG  ',args.join(' '));
}

function logError(...args) {
    logServer('ERROR',args.join(' '));
}

function logWarn(...args) {
    logServer('WARN ',args.join(' '));
}

function logInfo(...args) {
    logServer('INFO ',args.join(' '));
}    

function logDebug(...args) {
    logServer('DEBUG',args.join(' '));
}

module.exports = { logClient, logLog, logError, logWarn, logInfo, logDebug };