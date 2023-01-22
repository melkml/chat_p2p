import { createServer, Socket } from "net";
import { Room } from "../room";
import { PeerActionData } from "./interface";
import { PeerBroadcastAction } from "./enum";

export class Peer {
  address: string;
  socket: Socket | undefined;
  connections: Socket[] = [];
  room?: Room;

  constructor(address: string) {
    this.address = address;

    /**
     * Criando servido cujo callback será executado
     * Toda vez que um peer se conectar ao servidor
     */
    const server = createServer((socket) => {
      if (!this.room) {
        this.room = new Room(address);
      }
      this.connections.push(socket);
      this.prepareListeners(socket);

      this.broadcast({
        action: PeerBroadcastAction.UPDATE_ROOM,
        data: {
          admin: this.room.adminAdress,
          peers: this.room.peers.slice(1),
          addressBanneds: this.room.addressBanneds,
        },
      });
    });

    const port = address.split(":").at(1);

    server.listen(port, () =>
      console.log("Sala aberta! Aguardando alguém entrar...")
    );
  }

  get isAdmin() {
    return this.room?.adminAdress === this.address;
  }

  connect(address: string) {
    const [host, port] = address.split(":");

    this.socket = new Socket();

    this.socket.connect(+port, host, () => {
      this.onConnect();
    });
  }

  onConnect() {
    if (this.socket) {
      this.connections.push(this.socket);
      this.prepareListeners(this.socket);

      this.broadcast({
        action: PeerBroadcastAction.ANNOUNCE_SELF_CAME,
        data: this.address,
      });
    }
  }

  broadcast(peerAction: PeerActionData) {
    this.connections.forEach((socket) => {
      socket.write(JSON.stringify(peerAction));
    });
  }

  /**
   * Handler de todos os dados transmitidos que chegam aos peers
   * @param socket
   * @param data
   */

  handleData(socket: Socket, data: string) {
    const peerAction = JSON.parse(data) as PeerActionData;

    switch (peerAction.action) {
      case PeerBroadcastAction.ANNOUNCE_SELF_CAME:
        if (this.room) {
          const initMessage = `Peer ${peerAction.data} entrou na sala!`;
          console.log(initMessage);

          if (!this.room.peers.includes(peerAction.action)) {
            this.room.peers.push(peerAction.data);
          }
          /**
           * Caso o peer que chegou entrou por um peer não admin
           * Avisa a todos os peers que chegou alguem
           */
          this.broadcast({
            action: PeerBroadcastAction.ANNOUNCE_ANOTHER_CAME,
            data: peerAction.data,
          });
        }
        break;
      case PeerBroadcastAction.ANNOUNCE_ANOTHER_CAME:
        if (this.room) {
          const initMessage = `Peer ${peerAction.data} entrou na sala!`;
          console.log(initMessage);

          this.room.peers.push(peerAction.data);
        }
        break;
      case PeerBroadcastAction.SEND_MESSAGE:
        /**
         * Garantindo que todas as mensagens serão reproduzidas
         * aos peers
         */
        this.connections.forEach((connection) => {
          if (connection !== socket) {
            connection.write(data.toString());
          }
        });

        console.log(peerAction.actor + "> " + peerAction.data);
        break;
      case PeerBroadcastAction.UPDATE_ROOM:
        /**
         * Garante que os dados da sala (lista de peers, peers banidos, etc)
         * estarão sempre atualizados
         */
        if (!this.room) {
          this.room = new Room(peerAction.data.admin);
          this.room.peers.push(...peerAction.data.peers);
          this.room.addressBanneds.push(...peerAction.data.addressBanneds);
        }
        break;
      case PeerBroadcastAction.KICK:
        break;
      case PeerBroadcastAction.BAN:
        if (this.room) {
          this.room.peers.push(peerAction.data);
        }
        break;
    }
  }

  kick(adress: string, ban?: boolean) {
    if (this.isAdmin && this.room) {
      this.room.addressBanneds.push(adress);

      this.broadcast({
        action: ban ? PeerBroadcastAction.BAN : PeerBroadcastAction.KICK,
        data: adress,
      });
    }
  }

  list() {
    console.log(this.room?.peers);
  }

  private(adress: string, message: string) {
    this.broadcast({
      action: PeerBroadcastAction.SEND_PRIVATE_MESSAGE,
      subject: adress,
      data: message,
    });
  }

  private prepareListeners(socket: Socket) {
    socket.on("data", (data) => this.handleData(socket, data.toString()));

    socket.on("end", () => {
      this.connections = this.connections.filter((conn) => {
        return conn !== socket;
      });
    });
  }
}
