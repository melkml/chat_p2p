import { createServer, Socket } from "net";
import { Room } from "../room";
import { PeerActionData } from "./interface";
import { PeerBroadcastAction } from "./enum";

export class Peer {
  addressConecteds: string[] = [];
  address: string;
  socket: Socket | undefined;
  connections: Socket[] = [];
  room?: Room;
  notDisplay?: boolean;

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

      const data = {
        action: PeerBroadcastAction.UPDATE_ROOM,
        data: {
          admin: this.room?.adminAdress,
          addressBanneds: this.room?.addressBanneds,
          adressToConnect: this.addressConecteds,
        },
      };

      socket.write(JSON.stringify(data));
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
      this.onConnect(address);
    });
  }

  onConnect(address: string) {
    if (this.socket) {
      this.checkDisplay("Você entrou na sala!");

      this.addressConecteds.push(address);

      this.connections.push(this.socket);
      this.prepareListeners(this.socket);

      const data = {
        action: PeerBroadcastAction.ANNOUNCE_SELF_CAME,
        data: this.address,
      };

      this.socket.write(JSON.stringify(data));
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

  handleData(socket: Socket, data: string | Buffer) {
    const peerAction = JSON.parse(data.toString()) as PeerActionData;

    switch (peerAction.action) {
      case PeerBroadcastAction.ANNOUNCE_SELF_CAME:
        if (this.room) {
          console.log("Peer " + peerAction.data + " entrou na sala!");
          this.addressConecteds.push(peerAction.data);
        }
        break;
      case PeerBroadcastAction.SEND_MESSAGE:
        console.log(peerAction.actor + "> " + peerAction.data);
        break;
      case PeerBroadcastAction.UPDATE_ROOM:
        /**
         * Garante que os dados da sala
         * estarão sempre atualizados
         */
        if (!this.room) {
          this.room = new Room(peerAction.data.admin);
          this.room.addressBanneds.push(...peerAction.data.addressBanneds);
        }

        /**
         * Ao conectar com um peer, ele irá
         * solicitar que o novo peer se conecte a todos os peers que
         * estão na rede.
         */

        for (const peer of peerAction.data.adressToConnect) {
          this.notDisplay = true;

          if (!this.addressConecteds.includes(peer)) {
            this.connect(peer);
          }
        }

        break;
      case PeerBroadcastAction.KICK:
        break;
      case PeerBroadcastAction.BAN:
        if (this.room) {
          this.room.addressBanneds.push(peerAction.data);
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
    console.log(this.addressConecteds);
  }

  private(adress: string, message: string) {
    this.broadcast({
      action: PeerBroadcastAction.SEND_PRIVATE_MESSAGE,
      subject: adress,
      data: message,
    });
  }

  private prepareListeners(socket: Socket) {
    socket.on("data", (data) => this.handleData(socket, data));

    socket.on("end", () => {
      this.connections = this.connections.filter((conn) => {
        return conn !== socket;
      });
    });
  }

  private checkDisplay(message: string) {
    if (!this.notDisplay) {
      console.log(message);
    } else {
      this.notDisplay = false;
    }
  }
}
