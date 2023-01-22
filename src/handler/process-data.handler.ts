import { PeerBroadcastAction } from "../entities";
import { Peer } from "../entities/peer/peer";

interface CommandMapProp {
  peer: Peer;
  param?: string;
  message?: string;
}

export const commandMap: Record<string, any> = {
  "/ban": (prop: CommandMapProp) => {
    if (prop.param) prop.peer.kick(prop.param, true);
  },
  "/kick": (prop: CommandMapProp) => {
    if (prop.param) prop.peer.kick(prop.param);
  },
  "/private": (prop: CommandMapProp) => {
    if (prop.param && prop.message) prop.peer.private(prop.param, prop.message);
  },
  "/list": (prop: CommandMapProp) => prop.peer.list(),
  "/exit": (prop: CommandMapProp) =>
    prop.peer.exit({ log: "Você saiu da sala!", self: true }),
};

export const handleData = (peer: Peer, data: any) => {
  if (peer.room) {
    const message = data.toString().replace(/\n/g, "").trim();

    const dataArray = message.split(" ");

    let command = dataArray.shift();

    command = Object.keys(commandMap).find((key) => command?.includes(key));

    if (!commandMap[command as string]) {
      return peer.broadcast({
        action: PeerBroadcastAction.SEND_MESSAGE,
        data: message,
        actor: peer.address,
      });
    }

    const param = dataArray.shift();

    if (param) {
      const hasTagert = peer.addressConecteds.includes(param.toString());

      if (!hasTagert) {
        return console.log("O endereço informado não está na sala");
      }
    }

    commandMap[command as string]({ peer, param, message });
  }
};
