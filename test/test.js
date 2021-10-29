const util = require("util");
const net = require("net");
const log4jsAppender = require("../index.js");
const layouts = require("log4js/lib/layouts.js");
const retry = require("async-retry");

// https://github.com/isaacs/server-destroy/blob/master/index.js
function createDestroy(server) {
  const connections = {};

  server.on("connection", function (conn) {
    var key = conn.remoteAddress + ":" + conn.remotePort;
    connections[key] = conn;
    conn.on("close", function () {
      delete connections[key];
    });
  });

  return async function () {
    return new Promise((resolve, reject) => {
      server.close(() => {
        resolve();
      });
      for (var key in connections) {
        connections[key].destroy();
      }
    });
  };
}

function withServer(fn) {
  return async () => {
    const server = net.createServer();

    const destroy = createDestroy(server);

    await new Promise((resolve) => {
      server.listen(0, "localhost", () => {
        resolve();
      });
    });
    const chunks = [];

    server.on("connection", (connection) => {
      connection.on("data", (data) => {
        chunks.push(data.toString());
      });
    });

    try {
      await fn(server, chunks);
    } finally {
      await destroy();
    }
  };
}

it(
  "test log string message",
  withServer(async (server, messages) => {
    const { port } = server.address();
    const config = {
      category: "TEST",
      type: "log4js-logstashTCP",
      host: "localhost",
      port: port,
      fields: {
        instance: "MyAwsInstance",
        source: "myApp",
        environment: "development",
      },
    };

    const message = "Im awesome";
    const log = log4jsAppender.configure(config, layouts);

    const startTime = new Date();
    log({
      startTime,
      level: { levelStr: "FOO" },
      categoryName: "BAR",
      data: [message],
    });

    await retry(() => expect(messages.length).toBeGreaterThanOrEqual(1), {
      maxTimeout: 1000,
    });

    expect(JSON.parse(messages[0])).toEqual({
      "@timestamp": startTime.toISOString(),
      "@version": "1",
      category: "BAR",
      environment: "development",
      instance: "MyAwsInstance",
      level: "FOO",
      message: "Im awesome",
      source: "myApp",
      type: "TEST",
    });
  })
);

it(
  "test log error",
  withServer(async (server, messages) => {
    const { port } = server.address();
    const config = {
      category: "TEST",
      type: "log4js-logstashTCP",
      host: "localhost",
      port: port,
      fields: {
        instance: "MyAwsInstance",
        source: "myApp",
        environment: "development",
      },
    };

    const log = log4jsAppender.configure(config, layouts);

    const startTime = new Date();
    const error = new Error("Damn");
    log({
      startTime,
      level: { levelStr: "FOO" },
      categoryName: "BAR",
      data: [error],
    });

    await retry(() => expect(messages.length).toBeGreaterThanOrEqual(1), {
      maxTimeout: 1000,
    });

    expect(JSON.parse(messages[0])).toEqual({
      "@timestamp": startTime.toISOString(),
      "@version": "1",
      category: "BAR",
      environment: "development",
      instance: "MyAwsInstance",
      level: "FOO",
      message: error.stack,
      source: "myApp",
      type: "TEST",
    });
  })
);
