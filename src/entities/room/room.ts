export class Room {
  addressBanneds: string[] = [];
  adminAdress: string;

  constructor(adminAdress: string) {
    this.adminAdress = adminAdress;
  }
}
