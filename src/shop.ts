import {
  ShopConfiguration,
  Product,
  CheckoutOptions,
  Order,
} from './types/shop'
import { Storage } from './storage'
import HubApi from '@nimiq/hub-api'
import { WebCrypto } from './storage/encryption/webcrypto'
import { ShopCrypto } from './types/shop'

export class Shop {
  private configuration: ShopConfiguration
  private hubApi: HubApi
  private storage: Storage

  constructor(configuration: ShopConfiguration) {
    const { hubUrl, id, live } = configuration

    this.configuration = configuration
    this.storage = new Storage(id, live, live)
    this.hubApi = new HubApi(
      hubUrl || `https://hub.nimiq${live ? '' : '-testnet'}.com`,
    )
  }

  // front-end

  async checkout(products: Product[], meta: JSON): Promise<string> {
    const price =
      products
        .map(product => product.price)
        .reduce((sum, price) => sum + price) * 1e5

    const signedTx = await this.pay(price)
    const orderId = await this.order(products, meta, signedTx)

    return orderId
  }

  private async pay(price: number): Promise<HubApi.SignedTransaction> {
    const { name, address, fee, logo } = this.configuration
    const options: CheckoutOptions = {
      appName: name,
      recipient: address,
      value: price,
      fee,
      shopLogoUrl: logo,
    }
    return await this.hubApi.checkout(options)
  }

  private async order(
    products: Product[],
    meta: JSON,
    signedTx: HubApi.SignedTransaction,
  ): Promise<string> {
    const order: Order = {
      products,
      meta,
      txHash: signedTx.hash,
      timestamp: new Date().getTime(),
    }

    return await this.storage.store(order, this.configuration.publicKey)
  }

  // back-end

  async list(privateKey: JsonWebKey): Promise<Order[]> {
    return this.storage.list(privateKey)
  }

  // setup

  static async generateCrypto(): Promise<ShopCrypto> {
    const crypto = new WebCrypto()
    const pair = await crypto.generateKeyPair()

    const privateKey = await crypto.exportKey(pair.privateKey)
    const publicKey = await crypto.exportKey(pair.publicKey)
    const id = await crypto.hash(publicKey.n)

    return { privateKey, publicKey, id }
  }

  static generateConfiguration(publicKey: JsonWebKey, id: string): string {
    const config: ShopConfiguration = {
      name:
        'A name for your shop - customers will see this during the payment - short and easy to recognize',
      address: 'Your Nimiq address to receive payments on',
      logo:
        'URL of a 128x128px PNG file showing the logo of your shop on transparent background (optional)',
      live: false,
      id,
      publicKey,
    }
    return JSON.stringify(config, null, ' ')
  }
}
