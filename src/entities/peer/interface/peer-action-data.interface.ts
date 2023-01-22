import { PeerBroadcastAction } from "../enum";
import { Socket } from "net";

export interface PeerActionData {
  action: PeerBroadcastAction;
  actor?: string;
  subject?: string;
  data?: any;
  socket?: Socket;
}
