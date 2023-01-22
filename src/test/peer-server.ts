import { createServer, Server, Socket } from "net";
import { PeerClient } from "./peer-client";

export class PeerServer {
  client: PeerClient | undefined;
  address: string;
  server: Server;
  connections: Socket[] = [];

  constructor(address: string) {
    this.address = address;
    this.server = createServer((socket) => {
      console.log("Alguem se conectou.");

      this.connections.push(socket);

      socket.on("data", (data) => {
        if (this.client) {
          this.client.socket.write(data.toString());
        }

        console.log("SERVER" + address, data.toString().trim());

        this.broadcast(data, socket);
      });

      socket.on("end", () => {
        this.connections = this.connections.filter(
          (conection) => socket !== conection
        );

        console.log("Alguem se desconectou");
      });
    });

    const port = address.split(":")[1];

    this.server.listen(port, () => {
      console.log("Esperando alguem se conectar na porta " + port);
    });
  }

  sendMessage(message: string) {
    this.broadcast(message + this.address);
  }

  private broadcast(message: Buffer | string, socket?: Socket) {
    this.connections.forEach((connection) => {
      if (connection !== socket) {
        connection.write(message.toString().trim());
      }
    });
  }
}
