# log4js-logstash-tcp

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp?ref=badge_shield)

Based on the works of https://github.com/Aigent/log4js-logstash-tcp. Initially, a copy of the logstashUDP appender but instead sending via UDP send via TCP to avoid the maximum 64k bytes message size with the logstashUDP appender.

This fork was created to change the serialization of message to include stack traces. This changes the behaviour significantly from the original version.

## Usage: log4js configuration

Plain javascript

```javascript
const log4js = require("log4js");

log4js.configure({
  appenders: {
    console: {
      type: "console",
    },
    logstash: {
      type: "@tele2se/log4js-logstash-tcp",
      host: "<LOGSTASH_HOST>",
      port: "<PORT>",
      fields: {
        app_name: "application-name",
        index: "es-index",
      },
    },
  },
  categories: {
    default: {
      appenders: ["console", "logstash"],
      level: "debug",
    },
  },
});

const logger = log4js.getLogger();

module.exports = logger;
```

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp?ref=badge_large)
