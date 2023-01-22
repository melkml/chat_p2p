import { Peer } from "./entities";
import { handleData } from "./handler";

require("dotenv").config();

if (!process.env.PORT) {
  throw new Error("Variável de ambiente PORT não informada");
}

const port: string = process.argv.at(2) || "1000";

const peer = new Peer("localhost:" + port);

process.stdin.on("data", (data) => handleData(peer, data));

process.argv.slice(3).forEach((anotherPeerAddress) => {
  peer.connect(anotherPeerAddress);
});

// const port: string = process.argv.at(2) || "1000";
//
// const server = new PeerServer("localhost:" + port);
//
// process.stdin.on("data", (data) => server.sendMessage(data.toString()));
//
// process.argv.slice(3).forEach((anotherPeerAddress) => {
//   const client = new PeerClient(server);
//
//   client.connect(anotherPeerAddress);
//
//   process.stdin.on("data", (data) => client.sendMessage(data.toString()));
// });
