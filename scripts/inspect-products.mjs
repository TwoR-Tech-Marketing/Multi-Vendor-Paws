import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = JSON.parse(
  readFileSync(new URL('../firebase-service-account.json', import.meta.url), 'utf8'),
);

initializeApp({ credential: cert(sa) });
const db = getFirestore();

const cats = await db.collection('store').doc('items').collection('categories').get();
console.log('=== CATEGORIES (' + cats.size + ') ===');
const catRows = [];
for (const d of cats.docs) {
  const data = d.data();
  catRows.push({ id: d.id, name: data.name, order: data.order, isActive: data.isActive });
  console.log(
    '  ' +
      d.id +
      ' :: name=' +
      JSON.stringify(data.name) +
      ' order=' +
      data.order +
      ' isActive=' +
      data.isActive,
  );
}

console.log('\n=== PRODUCTS PER CATEGORY ===');
let totalProducts = 0;
let firstSample = null;
let secondSample = null;
for (const c of cats.docs) {
  const prods = await db
    .collection('store')
    .doc('items')
    .collection('categories')
    .doc(c.id)
    .collection('products')
    .get();
  console.log(
    '  ' + c.id + ' (' + (c.data().name || 'unnamed') + '): ' + prods.size + ' products',
  );
  totalProducts += prods.size;
  if (!firstSample && prods.size > 0) firstSample = prods.docs[0];
  if (firstSample && !secondSample && prods.size > 0 && prods.docs[0].id !== firstSample.id) {
    secondSample = prods.docs[0];
  }
}
console.log('\nTOTAL products: ' + totalProducts);

if (firstSample) {
  console.log('\n=== SAMPLE PRODUCT 1 (id=' + firstSample.id + ') ===');
  console.log(JSON.stringify(firstSample.data(), null, 2));
}
if (secondSample) {
  console.log('\n=== SAMPLE PRODUCT 2 (id=' + secondSample.id + ') ===');
  console.log(JSON.stringify(secondSample.data(), null, 2));
}

const newProducts = await db.collection('products').limit(1).get();
console.log('\n=== TOP-LEVEL products collection ===');
console.log('Has docs: ' + (newProducts.size > 0));

const storeProdsAll = await db
  .collection('store')
  .doc('products')
  .collection('all')
  .limit(1)
  .get();
console.log('\n=== store/products/all (admin "master" index) ===');
console.log('Has docs: ' + (storeProdsAll.size > 0));

process.exit(0);
