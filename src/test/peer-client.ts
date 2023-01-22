import { Socket } from "net";
import { PeerServer } from "./peer-server";

export class PeerClient {
  server: PeerServer;
  socket: Socket;

  constructor(server: PeerServer) {
    this.socket = new Socket();
    this.server = server;
  }

  connect(address: string) {
    const [host, port] = address.split(":");

    this.socket.connect(+port, host, () => {
      console.log("Conectou");
    });

    console.log(`Conectando a ${address}...`);

    this.server.client = this;

    this.socket.on("data", (data) => console.log(data.toString()));
  }

  sendMessage(message: string) {
    this.socket.write(message.trim() + "client");
  }
}
