export class Room {
  peers: string[] = [];
  addressBanneds: string[] = [];
  adminAdress: string;

  constructor(adminAdress: string) {
    this.adminAdress = adminAdress;
    this.peers.push(adminAdress);
  }
}
