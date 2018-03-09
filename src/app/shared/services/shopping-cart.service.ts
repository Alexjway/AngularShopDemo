import { AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { Product } from '../models/product';
import { AngularFireDatabase } from 'angularfire2/database';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import { ShoppingCart } from '../models/shopping-cart';

@Injectable()
export class ShoppingCartService {

  constructor(private db: AngularFireDatabase) { }

  // this method reads the shopping cart from firebase and
  // anotaded with Promise to sync with the shoppinCart to display the numbers
  async getCart(): Promise<Observable<ShoppingCart>> {
    let cartId = await this.getOrCreateCartId();
    return this.db.object('/shopping-carts/' + cartId)
      .snapshotChanges().map(action => {
        const key = action.key;
        const items = action.payload.val().items;
        return new ShoppingCart(key, items);
      });
  }

  async addToCart(product: Product) {
    this.updateItem(product, 1);
  }

  async removeFromCart(product: Product) {
    this.updateItem(product, -1);
  }

  async clearCart() {
    let cartId = await this.getOrCreateCartId();
    this.db.object('/shopping-carts/' + cartId + '/items').remove();
  }

  private create() {
    return this.db.list('/shopping-carts').push({
      dateCreated: new Date().getTime()
    });
  }

  private getItem(cartId: string, productId: string) {
    return this.db.object('/shopping-carts/' + cartId + '/items/' + productId);
  }

  // async method will return a promise later
  private async getOrCreateCartId() {
    let cartId = localStorage.getItem('cartId');
    // if you cardId already
    if (cartId) { return cartId; }

    // otherwise create a new one
    let result = await this.create();
    localStorage.setItem('cartId', result.key);
    return result.key;
  }

  private async updateItem(product: Product, change: number) {
    let cartId = await this.getOrCreateCartId();

    let item$ = this.getItem(cartId, product.$key);
  
    item$.snapshotChanges().take(1).subscribe(item => {
      const itemPayload = item.payload.val();
      const quantity = (itemPayload ? itemPayload.quantity : 0) + change;

      if (quantity === 0) item$.remove();
      else
        item$.update({
          title: product.title,
          price: product.price,
          // category: product.category,
          imageUrl: product.imageUrl,
          quantity: quantity
        });
    });
  }
}