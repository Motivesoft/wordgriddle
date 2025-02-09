function formatMessage(source, level, message) {
    return `${getCurrentDateTime()} : ${source} : ${level} : ${message}`;
}

function getCurrentDateTime() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
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