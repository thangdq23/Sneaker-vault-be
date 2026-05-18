import 'dotenv/config';
import connectDB from './src/config/db.js';
import { removeCartItem } from './src/cart/cart.controller.js';
import Cart from './src/cart/cart.model.js';

await connectDB();
const userId = '6a0ab7292179a491e8c3459e';
const cart = await Cart.findOne({ user: userId });
console.log('cart items', cart.items.map(i => ({ id: i._id.toString(), product: i.product.toString(), size: i.size, qty: i.quantity })));
const itemId = cart.items[0]._id.toString();
console.log('itemId', itemId);
const req = { user: { id: userId }, params: { itemId } };
let status = 200;
const res = { status(code) { status = code; return this; }, json(obj) { console.log('RESULT', status, obj); } };
await removeCartItem(req, res);
