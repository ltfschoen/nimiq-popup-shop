import { Encryption } from '..'

export class DummyEncryption implements Encryption {
  encrypt(data: Uint8Array): Promise<Uint8Array> {
    return new Promise(resolve => resolve(data))
  }
  decrypt(data: Uint8Array): Promise<Uint8Array> {
    return new Promise(resolve => resolve(data))
  }
}
