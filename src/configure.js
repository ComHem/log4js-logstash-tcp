const { TcpConnectionPool } = require("./TcpConnectionPool");
const { version, name } = require("../package.json");

function logstashTCP(config) {
  const type = config.logType ? config.logType : config.category;
  const tcpConnectionPool = new TcpConnectionPool();

  function sendLog(host, port, logObject) {
    tcpConnectionPool.send(host, port, logObject);
  }

  if (!config.fields) {
    config.fields = {};
  }

  function formatData(entry) {
    if (entry instanceof Error) {
      if (entry.stack) {
        return entry.stack;
      }

      return entry.message;
    }

    if (typeof entry === "string") {
      return entry;
    }

    return JSON.stringify(entry);
  }

  function log(loggingEvent) {
    /*
         https://gist.github.com/jordansissel/2996677
         {
         'message'    => 'hello world',
         '@version'   => '1',
         '@timestamp' => '2014-04-22T23:03:14.111Z',
         'type'       => 'stdin',
         'host'       => 'hello.local'
         }
         @timestamp is the ISO8601 high-precision timestamp for the event.
         @version is the version number of this json schema
         Every other field is valid and fine.
         */
    const fields = {};
    Object.keys(config.fields).forEach((key) => {
      fields[key] =
        typeof config.fields[key] === "function"
          ? config.fields[key](loggingEvent)
          : config.fields[key];
    });

    sendLog(config.host, config.port, {
      "@version": "1",
      "@timestamp": new Date(loggingEvent.startTime).toISOString(),
      type: type,
      message: loggingEvent.data.map(formatData).join(" "),
      level: loggingEvent.level.levelStr,
      category: loggingEvent.categoryName,
      appender: `${name}@${version}`,
      ...fields,
    });
  }

  log.shutdown = function (cb) {
    cb();
  };

  return log;
}

function configure(config) {
  return logstashTCP(config);
}

module.exports = configure;
