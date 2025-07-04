const admin = require("firebase-admin");
const { getFirestore,Timestamp } = require("firebase-admin/firestore");
const xlsx = require('xlsx');
const fs = require('fs');


// Initialize Firebase Admin
const firebaseConfig = {
 apiKey: "AIzaSyDf8fWEqcsW4MW5xUj-jXIUiSRKib06GpQ",
  authDomain: "tullin-ecce0.firebaseapp.com",
  projectId: "tullin-ecce0",
  storageBucket: "tullin-ecce0.firebasestorage.app",
  messagingSenderId: "731579369642",
  appId: "1:731579369642:web:cb2267044a6f3d34e6e8d3"
};
admin.initializeApp(firebaseConfig);
const db = getFirestore();
const addDepotsToBackend = async ()=> {
  try {
   

    const depots = [
    {
      id: "depot1",
      name: "Dépôt A",
      location: "Zone Industrielle, Alger",
      manager: "Mohamed Ali",
      capacity: "5000 m²",
      status: "active",
      priority: "principale",
      type: "principale",
      quantity: 500,
      product_id: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot2",
      name: "Dépôt B",
      location: "Centre Ville, Oran",
      type: "principale",
      manager: "Karim Benzema",
      capacity: "2500 m²",
      status: "active",
      priority: "principale",
      quantity: 300,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot3",
      name: "Dépôt C",
      location: "Port, Annaba",
      manager: "Sofiane Feghouli",
      capacity: "3000 m²",
      status: "maintenance",
      priority: "principale",
      type: "principale",
      quantity: 400,
      productId: "prod3",
      productName: "Chemise",
    },
    {
      id: "depot4",
      name: "Dépôt A2",
      location: "Zone Industrielle, Alger",
      manager: "Ahmed Benali",
      capacity: "2000 m²",
      status: "active",
      priority: "secondaire",
      quantity: 200,
      productId: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot5",
      name: "Dépôt B2",
      location: "Centre Ville, Oran",
      manager: "Yacine Brahimi",
      capacity: "1500 m²",
      status: "active",
      priority: "secondaire",
      quantity: 150,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot6",
      name: "Dépôt C2",
      location: "Port, Annaba",
      manager: "Riyad Mahrez",
      capacity: "1800 m²",
      status: "active",
      priority: "secondaire",
      quantity: 180,
      productId: "prod3",
      productName: "Chemise",
    },
    // Add variant-specific depots
    {
      id: "depot-var1-main",
      name: "Dépôt T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Ismail Bennacer",
      capacity: "500 m²",
      status: "active",
      priority: "principale",
      quantity: 30,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var1-sec",
      name: "Dépôt Secondaire T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Islam Slimani",
      capacity: "300 m²",
      status: "active",
      priority: "secondaire",
      quantity: 15,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var2-main",
      name: "Dépôt T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Aissa Mandi",
      capacity: "400 m²",
      status: "active",
      priority: "principale",
      quantity: 25,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
    {
      id: "depot-var2-sec",
      name: "Dépôt Secondaire T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Youcef Atal",
      capacity: "250 m²",
      status: "active",
      priority: "secondaire",
      quantity: 10,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
  ]

    if (!Array.isArray(depots)) {
      return ;
    }

    const batch = db.batch();

    for (const depot of depots) {
      if (!depot.id) continue;

      const depotRef = db.collection("depots").doc(depot.id);
      batch.set(depotRef, depot, { merge: true });
    }

    await batch.commit();

  
  } catch (err) {
    console.error("Error adding depots:", err);
 
}
}
// --- Include your existing utility functions here ---
function extractWilayaFromProvince(province) {
  if (!province) return undefined;
  const match = province.match(/\d{2}/);
  return match ? match[0] : undefined;
}

function mapFinancialStatusToOrderStatus(financialStatus) {
  const statusMap = {
    'pending': 'en-attente',
    'authorized': 'confirmée',
    'partially_paid': 'en-cours',
    'paid': 'confirmée',
    'partially_refunded': 'retournée',
    'refunded': 'annulée',
    'voided': 'annulée'
  };
  return statusMap[financialStatus] || 'en-attente';
}

function formatAddress(address) {
  if (!address) return undefined;
  return [address.address1, address.address2, address.city, address.province, address.country]
    .filter(Boolean).join(', ');
}

function convertShopifyOrderToCustomFormat(shopifyOrder) {
  const rawProvince = shopifyOrder.billing_address?.city;
  const wilaya = extractWilayaFromProvince(rawProvince);
  const convertedOrder = {
    id: shopifyOrder.order_number ? shopifyOrder.order_number.toString() : "",
    date: shopifyOrder.created_at ? shopifyOrder.created_at.split('T')[0] : "",
    name: shopifyOrder.shipping_address?.name || "",
    phone: shopifyOrder.phone ? shopifyOrder.phone.replace('+213', '0') : "",
    articles: [],
    wilaya: wilaya|| "",
    commune: shopifyOrder.shipping_address?.city || "",
    deliveryType: "home-delivery", // Default value as per shipping method
    deliveryCompany: "", // Not available in Shopify data
    deliveryCenter:"", // Not available in Shopify data
    confirmationStatus: "En attente", // Default status
    pickupPoint: "",
    status: mapFinancialStatusToOrderStatus(shopifyOrder.financial_status),
    deliveryPrice: shopifyOrder.shipping_lines && shopifyOrder.shipping_lines.length > 0 ? 
                  `${shopifyOrder.shipping_lines[0].price} ${shopifyOrder.currency}` : undefined,
    address: formatAddress(shopifyOrder.shipping_address),
    additionalInfo: shopifyOrder.note || "",
    confirmatrice: "", // Not available in Shopify data
    totalPrice: `${shopifyOrder.total_price} ${shopifyOrder.currency}`,
    source: shopifyOrder.source_name || "Shopify",
    statusHistory: [
    ],
    createdAt: new Date(shopifyOrder.processed_at)
  };

  // Process line items (articles)
  if (shopifyOrder.line_items && Array.isArray(shopifyOrder.line_items)) {
    shopifyOrder.line_items.forEach(item => {
      const variantTitle = item.variant_title || "";
      const variantParts = variantTitle.split(" / ");
      
      const article = {
        product_id: item.product_id,
        product_name: item.title,
        variant_id: item.variant_id,
        variant_title: item.variant_title,
        variant_options: {
    option1: variantParts[0] ?? null,
  option2: variantParts[1] ?? null,
        },
        quantity: item.quantity,
        unit_price: item.price,
        product_sku: item.sku || "",
        variant_sku: item.sku || ""
      };
      
      convertedOrder.articles.push(article);
    });
  }

  return convertedOrder;
}

// --- Main function ---
async function processTodayOrders() {
  const afterDate = new Date("2025-05-24T00:00:00.000Z"); // Adjust if needed

  const ordersSnapshot = await db.collection('Orders')
    .where('processed_at', '>', afterDate.toISOString())
    .get();


  const batch = db.batch();
  let processedCount = 0;

  ordersSnapshot.forEach(doc => {
    const shopifyOrder = doc.data();

    const firstItem = shopifyOrder.line_items?.[0];
    if (!firstItem || firstItem.product_id !== 9900868993302) {
      return; // Skip orders not matching the product ID
    }
    console.log("prod",shopifyOrder.line_items[0].product_id);
    
    
    const transformedOrder = convertShopifyOrderToCustomFormat(shopifyOrder);
    const newOrderRef = db.collection('orders').doc();
    batch.set(newOrderRef, transformedOrder);
    processedCount++;
  });

  if (processedCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Processed and stored ${processedCount} orders with product_id 9900868993302 after Jan 1, 2024.`);
}

//processTodayOrders().catch(console.error);
async function deleteDuplicateOrdersByIdField() {
  const snapshot = await db.collection("orders").get();

  if (snapshot.empty) {
    console.log("No orders found.");
    return;
  }

  const seenIds = new Map();
  const duplicates = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const orderId = data.id;

    if (!orderId) return;

    if (seenIds.has(orderId)) {
      // Mark this doc for deletion
      duplicates.push(doc.ref);
    } else {
      seenIds.set(orderId, doc.id); // Track the first occurrence
    }
  });

  if (duplicates.length === 0) {
    console.log("✅ No duplicates found.");
    return;
  }

  console.log(`🗑️ Found ${duplicates.length} duplicates. Deleting...`);

  // Firestore allows max 500 writes per batch
  while (duplicates.length > 0) {
    const batch = db.batch();
    const batchRefs = duplicates.splice(0, 500);
    batchRefs.forEach(ref => batch.delete(ref));
    await batch.commit();
  }

  console.log("✅ Duplicate orders deleted.");
}

//deleteDuplicateOrdersByIdField().catch(console.error);
async function deleteOrdersWithProduct(productIdToDelete) {
  const snapshot = await db.collection("orders").get();

  if (snapshot.empty) {
    console.log("No orders found.");
    return;
  }

  const batch = db.batch();
  let deleteCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();

    const hasMatchingProduct = Array.isArray(data.articles) &&
      data.articles.some(article => article.product_id === productIdToDelete);

    if (hasMatchingProduct) {
      batch.delete(doc.ref);
      deleteCount++;
    }
  });

  if (deleteCount > 0) {
    await batch.commit();
  }

  console.log(`🗑️ Deleted ${deleteCount} orders containing product_id ${productIdToDelete}`);
}

// Run it
//deleteOrdersWithProduct(9900868993302).catch(console.error);
async function enrichVariantsWithDepotForInvoices(invoiceIds) {
  console.log("Starting depot enrichment...");

  for (const invoiceId of invoiceIds) {
    const docRef = db.collection("invoices").doc(invoiceId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.warn(`Invoice not found: ${invoiceId}`);
      continue;
    }

    const data = docSnap.data();
    const items = data.items || [];

    for (const item of items) {
      const { productId, variantId, depot, quantity } = item;

      // ✅ Only process this product ID
      if (productId !== "9895182237974") continue;

      const depotId = depot;
      console.log("Processing:", { depotId, productId, variantId });

      const variantRef = db
        .collection("Products")
        .doc(productId.toString())
        .collection("variants")
        .doc(variantId.toString());

      const variantSnap = await variantRef.get();

      if (!variantSnap.exists) {
        console.warn(`Variant not found: product ${productId}, variant ${variantId}`);
        continue;
      }

      const variantData = variantSnap.data();

      // Skip if depot info already exists
      if (Array.isArray(variantData?.depots) && variantData.depots.length > 0) {
        console.log(`Skipping variant ${variantId} (already has depots)`);
        continue;
      }

      const depotRef = db.collection("depots").doc(depotId);
      const depotSnap = await depotRef.get();

      if (!depotSnap.exists) {
        console.warn(`Depot not found: ${depotId}`);
        continue;
      }

      const depotData = depotSnap.data();

      const newDepots = [
        {
          id: depotId,
          ...depotData,
          quantity: quantity,
        },
      ];

      await variantRef.update({
        depots: newDepots,
      });

      console.log(`✅ Updated depot[0].quantity to ${quantity} for variant ${variantId} in product ${productId}`);
    }
  }

  console.log("Depot enrichment completed.");
}
// Run the function for all invoice IDs
const invoiceIds = [
  "3kdXkopTMKqnWpy0jcJg",
  "9fHZxZGaaH4NB8YhSuns",
  "a6FkdHvUNkQ8OFFagY4B",
  "hT5EK4XErRCf52UtBBLx",
];

//enrichVariantsWithDepotForInvoices(invoiceIds).catch(console.error);

/**
 * Parse Excel file to extract product information with each color-size as a separate variant
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} - Array of products with their variants
 */
function parseProductExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: 0 });

  const products = [];
  let currentProduct = null;
  let sizeColumns = {};
  const headerRow = data[0];

  for (let i = 0; i < Math.min(headerRow.length, 9); i++) {
    const header = headerRow[i];
    if (header && /^[0-9]+$/.test(header.toString())) {
      const num = parseInt(header);
      if (num >= 30 && num <= 50) {
        sizeColumns[i] = num.toString();
      }
    }
  }

  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!row || row.slice(0, 9).every(cell => cell === 0 || cell === null || cell === '')) continue;

    if (row[0] && row[1] && !isNaN(parseFloat(row[1]))) {
      if (currentProduct) products.push(currentProduct);
      currentProduct = {
        code: row[0],
        price: parseFloat(row[1]),
        variants: []
      };
    }

    if (row[2] && currentProduct) {
      const color = row[2].toString().trim();
      Object.keys(sizeColumns).forEach(colIndex => {
        const size = sizeColumns[colIndex];
        let quantity = parseInt(row[colIndex]) || 0;

        currentProduct.variants.push({
          color,
          size,
          quantity
        });
      });
    }
  }

  if (currentProduct) products.push(currentProduct);
  return products;
}

/**
 * Syncs parsed variants to Firestore
 */
async function syncVariantsToFirestore(products) {
  const unfound = [];

  for (const product of products) {
    const productSnap = await db.collection('Products')
      .where('title', '==', product.code)
      .limit(1)
      .get();

    if (productSnap.empty) {
      console.log(`❌ Product not found: ${product.code}`);
      product.variants.forEach(v => unfound.push({ code: product.code, ...v }));
      continue;
    }

    const productDoc = productSnap.docs[0];
    const productRef = db.collection('Products').doc(productDoc.id);

    for (const variant of product.variants) {
      const variantsRef = productRef.collection('variants');
      const query = await variantsRef
        .where('option1', 'in', [variant.color, variant.size])
        .where('option2', 'in', [variant.color, variant.size])
        .get();

      let matched = false;
      query.forEach(doc => {
        const data = doc.data();
        const match1 = data.option1 === variant.color && data.option2 === variant.size;
        const match2 = data.option1 === variant.size && data.option2 === variant.color;


        if (match1 || match2) {
          matched = true;
          const updatedQty = (data.inventory_quantity || 0) + variant.inventory_quantity;
        
          variantsRef.doc(doc.id).update({
            quantity: updatedQty,
            depots: [{
  "id": "orHpkO2hxJfIBxzcBOyM",
   "name": "en linge chine",
  type:"principale",
quantity: variant.quantity,
}]
          });

          console.log(`✅ Updated: ${variant.color} / ${variant.size}`);
        }
      });

      if (!matched) {
        unfound.push({ code: product.code, ...variant });
      }
    }
  }

  if (unfound.length > 0) {
    fs.writeFileSync('unfound_variants.json', JSON.stringify(unfound, null, 2));
    console.log(`⚠️  Unfound variants saved to unfound_variants.json`);
  }
}

/**
 * Run everything
 */
async function main() {
  const filePath = 'product.xlsx';
  try {
    const products = parseProductExcel(filePath);
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
    console.log(`✅ Parsed ${products.length} products`);

    await syncVariantsToFirestore(products);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
//main().catch(console.error);
async function retryUnfoundVariantsFromFile(filePath) {
  const unfoundVariants = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const stillUnfound = [];

  for (const variant of unfoundVariants) {
    const productSnap = await db.collection('Products')
      .where('title', '==', variant.code)
      .limit(1)
      .get();


    if (productSnap.empty) {
      console.log(`❌ Product with handle not found: ${variant.code}`);
      stillUnfound.push(variant);
      continue;
    }

    const productDoc = productSnap.docs[0];
    const variantsRef = db.collection('Products').doc(productDoc.id).collection('variants');
 const query = await variantsRef
      .where('option1', 'in', [variant.color, variant.size])
      .where('option2', 'in', [variant.color, variant.size])
      .get();

    let matched = false;
    query.forEach(doc => {
     
      const data = doc.data();
      console.log(data);
      
      const match1 = data.option1 === variant.color && data.option2 === variant.size;
      const match2 = data.option1 === variant.size && data.option2 === variant.color;
console.log(data.option1,data.option2,variant.color,variant.size);

        if (match1 || match2) {
          matched = true;
          const updatedQty = (data.inventory_quantity || 0) + variant.inventory_quantity;
        
          variantsRef.doc(doc.id).update({
            quantity: updatedQty,
            depots: [{
  "id": "orHpkO2hxJfIBxzcBOyM",
   "name": "en linge chine",
  type:"principale",
quantity: variant.quantity,
}]
          });

          console.log(`✅ Updated: ${variant.color} / ${variant.size}`);
        }
    });

    if (!matched) {
      stillUnfound.push(variant);
    }
  }

  if (stillUnfound.length > 0) {
    fs.writeFileSync('unfound_variants.json', JSON.stringify(stillUnfound, null, 2));
    console.log('⚠️ Still unfound variants saved back to unfound_variants.json');
  } else {
    console.log('✅ All previously unfound variants processed successfully.');
    fs.unlinkSync('unfound_variants.json');
  }
}
async function main1() {
  try {


    if (fs.existsSync('unfound_variants.json')) {
      console.log('🔁 Retrying unfound variants based on product handle...');
      await retryUnfoundVariantsFromFile('unfound_variants.json');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
//main1().catch(console.error);
async function enrichOrderArticlesWithDepot() {
  const ordersSnapshot = await db.collection("orders").get();

  for (const orderDoc of ordersSnapshot.docs) {
    const orderRef = orderDoc.ref;
    const orderData = orderDoc.data();
    const articles = orderData.articles || [];

    const updatedArticles = await Promise.all(
      articles.map(async (article) => {
        const {
          product_id,
          variant_id,
        } = article;

        if (!product_id || !variant_id) return article;

        const variantRef = db
          .collection("Products")
          .doc(product_id.toString())
          .collection("variants")
          .doc(variant_id.toString());

        const variantSnap = await variantRef.get();

        if (!variantSnap.exists) {
          console.warn(`Variant not found for product ${product_id}, variant ${variant_id}`);
          return article;
        }

        const variantData = variantSnap.data();
        const firstDepot = Array.isArray(variantData.depots) ? variantData.depots[0] : null;

        if (!firstDepot) {
          console.warn(`No depot info found in variant ${variant_id}`);
          return article;
        }

        return {
          ...article,
          depot: {
            id: firstDepot.id || null,
            name: firstDepot.name || null,
            type: firstDepot.type || null,
            quantity: firstDepot.quantity || 0,
          },
        };
      })
    );

    // Update order with enriched articles
    await orderRef.update({ articles: updatedArticles });
    console.log(`✅ Updated order ${orderRef.id} with depot info in articles.`);
  }
}
//enrichOrderArticlesWithDepot().catch(console.error);
function generateReferenceFromDepots(depots) {
  if (!Array.isArray(depots) || depots.length === 0) return "";

  const allSameDepot = depots.every((d) => d.id === depots[0].id);
  let prefix = allSameDepot
    ? (depots[0].name || "DEPOT").substring(0, 5).toUpperCase()
    : "DEPOTD";

  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().substring(9, 13);

  return `${prefix}-${randomStr}${timestamp}`;
}
async function addReferenceToExistingOrders() {
  const ordersSnap = await db.collection("orders").get();

  for (const doc of ordersSnap.docs) {
    const order = doc.data();

    // Skip if reference already exists
    if (order.orderReference) {
      continue;
    }

    const depots = (order.articles || [])
      .map((a) => a.depot)
      .filter((d) => d && d.id);

    if (depots.length === 0) {
      console.warn(`🚫 No valid depots for order ${doc.id}`);
      continue;
    }

    const reference = generateReferenceFromDepots(depots);

    await doc.ref.update({ orderReference:reference });
    console.log(`✅ Reference ${reference} added to order ${doc.id}`);
  }

  console.log("🎉 Finished updating references for all orders.");
}

//addReferenceToExistingOrders().catch(console.error);
async function deleteOldOrders() {
  const cutoffDate = new Date('2025-05-24T12:40:00Z'); // UTC time

  const snapshot = await db
    .collection('orders')
    .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
    .get();

  if (snapshot.empty) {
    console.log('No orders to delete before cutoff.');
    return;
  }

  const batchSize = 500;
  let batchCount = 0;
  let deletedCount = 0;

  while (!snapshot.empty) {
    const batch = db.batch();
    let counter = 0;

    for (const doc of snapshot.docs) {
      if (counter >= batchSize) break;

      batch.delete(doc.ref);
      counter++;
      deletedCount++;
    }

    await batch.commit();
    batchCount++;

    console.log(`Batch ${batchCount}: Deleted ${counter} documents`);
    break; // Remove this break if snapshot is dynamically refreshed for more than 500 docs
  }

  console.log(`Finished deleting. Total orders deleted: ${deletedCount}`);
}
//deleteOldOrders().catch(console.error);
function generateRandomReference() {
  const randomStr = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `ATELI-${randomStr}`;
}
async function updateMissingOrderReferences() {
  const snapshot = await db
    .collection("orders")
    .where("status", "==", "Confirmé")
    .where("orderReference", "==", "")
    .get();

  if (snapshot.empty) {
    console.log("No orders found with status 'Confirme' and empty orderReference.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const newRef = generateRandomReference();
    console.log(`Updating order ${doc.id} -> ${newRef}`);
    batch.update(doc.ref, { orderReference: newRef });
  });

  await batch.commit();
  console.log("✅ Order references updated successfully.");
}

//updateMissingOrderReferences().catch(console.error);
async function getAndUpdatePendingOrders() {
  const ordersRef = db.collection("orders");
  const snapshot = await ordersRef.get();

  const seenPhones = new Set();
  let updatedCount = 0;

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const phone = data.phone?.trim();
    const statusHistory = data.statusHistory;

    const hasEmptyStatusHistory =
      !statusHistory || (Array.isArray(statusHistory) && statusHistory.length === 0);

    if (
      data.deliveryCompany &&
      data.deliveryCompany.trim() !== "" &&
      data.status === "en-attente" &&
      data.orderReference !== "" &&
      data.date === "2025-05-28" &&
      phone &&
      hasEmptyStatusHistory &&
      !seenPhones.has(phone)
    ) {
      seenPhones.add(phone);
      batch.update(doc.ref, {
        status: "Confirmé",
        confirmationStatus: "Confirmé",
      });
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`✅ Updated ${updatedCount} matching orders.`);
  } else {
    console.log("ℹ️ No matching orders found.");
  }
}

// Run the function
//getAndUpdatePendingOrders();

async function updateOrderStatuses() {
  const ordersRef = db.collection("orders");
  const snapshot = await ordersRef.where("lastStatus", "==", "in-preparation").get();

  if (snapshot.empty) {
    console.log("No matching orders found.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    const docRef = doc.ref;
    batch.update(docRef, {
      status: "En préparation"
    });
  });

  await batch.commit();
  console.log(`${snapshot.size} order(s) updated to status: e preparation`);
}

async function getOrdersWithMissingLastStatus() {
  const ordersRef = db.collection("orders");
  
  // Step 1: Query orders with status "EN livraison"
  const snapshot = await ordersRef.where("status", "==", "En livraison").get();

  if (snapshot.empty) {
    console.log("No orders found with status 'EN livraison'.");
    return;
  }

  const ordersWithoutLastStatus = [];

  // Step 2: Filter those missing 'lastStatus'
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.hasOwnProperty("lastStatus")) {
      ordersWithoutLastStatus.push({
        id: doc.id,
        ...data
      });
    }
  });

  console.log(`${ordersWithoutLastStatus.length} order(s) found without 'lastStatus':`);
  console.log(ordersWithoutLastStatus);
}

async function fixOrdersWithMissingLastStatus() {
  const ordersRef = db.collection("orders");
  const snapshot = await ordersRef.where("status", "==", "En livraison").get();

  if (snapshot.empty) {
    console.log("No matching orders found.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    // Only update if 'lastStatus' is missing
    if (!data.hasOwnProperty("lastStatus")) {
      batch.update(doc.ref, {
        status: "En préparation"
      });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`${count} order(s) updated to 'En préparation'.`);
  } else {
    console.log("No orders needed updating.");
  }
}

async function updateOrdersFromLastStatus() {
  const ordersRef = db.collection("orders");
  const snapshot = await ordersRef.where("lastStatus", "==", "in-preparation").get();

  if (snapshot.empty) {
    console.log("No orders found with lastStatus 'in-preparation'.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    batch.update(doc.ref, {
      status: "En préparation"
    });
    count++;
  });

  await batch.commit();
  console.log(`${count} order(s) updated to status 'En préparation'.`);
}

async function fetchYalidineStatusesForDispatcherOrders() {
  const snapshot = await db.collection("orders")
    .where("status", "==", "Annulé")
    .get();

  if (snapshot.empty) {
    console.log("No dispatcher orders found.");
    return;
  }

  const batch = db.batch(); // Firestore batch for safe bulk update
  const BATCH_SIZE = 500; // Firestore limit

  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

      try {
       

          batch.update(doc.ref, { status:"Annulé", confirmationStatus:"Annulé" });
          count++;

      } catch (err) {
        console.warn(`Skipping malformed label for doc ${doc.id}`);
      }
    
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Updated ${count} documents with trackingId.`);
  } else {
    console.log("ℹ️ No trackingId updates performed.");
  }
}
//fetchYalidineStatusesForDispatcherOrders()
async function cancelUnassignedPendingOrders() {
  const snapshot = await db.collection("orders").where("lastStatus", "==", "delivered")
    .get();

  if (snapshot.empty) {
    console.log("No matching orders found.");
    return;
  }

  const batch = db.batch();

  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { status: "Annulé" });
  });

  await batch.commit();
  console.log(`${snapshot.size} orders updated to "Livrés"`);
}
async function getTodayOrders() {
  const now = new Date();

  // Start of today: 00:00:00
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // End of today: 23:59:59.999
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayStart = Timestamp.fromDate(startOfToday);
  const todayEnd = Timestamp.fromDate(endOfToday);

  const snapshot = await db.collection("orders")
    .where("status", "==", "en-attente")
    .where("confirmationStatus", "==", "Confirmé")
    .where("updatedAt", ">=", todayStart)
    .where("updatedAt", "<=", todayEnd)
    .get();

  if (snapshot.empty) {
    console.log("No matching orders found.");
    return [];
  }

  const orders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(`Found ${orders.length} orders.`);
    const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const docRef = db.collection("orders").doc(doc.id);
    batch.update(docRef, { status: "Confirmé" });
  });

  await batch.commit();
  return orders;
}
//getTodayOrders()
async function updateAnnuleOrders() {
  const snapshot = await db.collection("orders")
    .where("status", "==", "en-attente")
    .where("confirmationStatus", "==", "Annulé")
    .get();

  if (snapshot.empty) {
    console.log("No matching orders found.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    const orderRef = db.collection("orders").doc(doc.id);
    batch.update(orderRef, {
      status: "Annulé",
      confirmationStatus: "Annulé",
      updatedAt: new Date(),
    });
  });

  await batch.commit();
  console.log(`Updated ${snapshot.size} orders to 'Annulé'.`);
}

// Call the function

async function updateReturnedOrders() {
  const snapshot = await db.collection("orders").get();

  const batch = db.batch();
  let count = 0;

 snapshot.forEach(doc => {
  const data = doc.data();
  const lastStatus = data.lastStatus;

  if (lastStatus === "returned-to-center" || lastStatus === "returning-to-center") {
    const orderRef = db.collection("orders").doc(doc.id);

    // Get last element of shippmentTrack
    const track = Array.isArray(data.shippmentTrack) ? data.shippmentTrack : [];
    const lastTrack = track[track.length - 1];

    // Convert "YYYY-MM-DD HH:mm:ss" to Date
    const updatedAt = lastTrack?.date
      ? new Date(lastTrack.date.replace(" ", "T")) // "2025-06-09 08:37:26" -> "2025-06-09T08:37:26"
      : new Date(); // fallback to current date if missing

    batch.update(orderRef, {
      status: "Retour",
      updatedAt: updatedAt,
    });

    count++;
  }
});

  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} orders to 'Retour'.`);
  } else {
    console.log("No orders to update.");
  }
}

// Call the function
//updateReturnedOrders().catch(console.error);

async function markDoubleConfirmedOrders() {
  const activeStatuses = ["Confirmé", "En préparation", "Dispatcher", "En livraison"]

  const ordersSnapshot = await db
    .collection("orders")
    .where("status", "in", activeStatuses)
    .get()

  const allOrders = ordersSnapshot.docs.map((doc) => ({
   
    ...doc.data(),
     id: doc.id,
  }))

  const batch = db.batch()
  let updatedCount = 0

  for (const order of allOrders) {
    if (order.status === "Confirmé" && order.phone) {
      const samePhoneOrders = allOrders.filter(
        (o) => o.phone === order.phone && o.id !== order.id
      )
      console.log(`Checking order ${order.id} with phone ${order.phone}, found ${samePhoneOrders.length} matching orders.`);
      
      for (const other of samePhoneOrders) {
        const orderRef = db.collection("orders").doc(other.id)
        batch.update(orderRef, {
          confirmationStatus: "Confirmé Double",
          updatedAt: new Date(),
        })
        updatedCount++
      }
    }
  }

  if (updatedCount > 0) {
    await batch.commit()
    console.log(`✅ ${updatedCount} orders updated to 'Double Confirmé'`)
  } else {
    console.log("ℹ️ No matching orders to update")
  }
}
//markDoubleConfirmedOrders().catch(console.error);
async function markDuplicateConfirmedOrders() {
  const ordersRef = db.collection("orders");
  const snapshot = await ordersRef.where("status", "==", "Confirmé").get();

  if (snapshot.empty) {
    console.log("No orders found with status Confirmé.");
    return;
  }

  const phoneToOrders = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const phone = data.phone;
    if (!phone) return;

    if (!phoneToOrders.has(phone)) {
      phoneToOrders.set(phone, []);
    }
    phoneToOrders.get(phone).push({ id: doc.id, ...data });
  });

  const batch = db.batch();
  let updateCount = 0;

  for (const [phone, orders] of phoneToOrders.entries()) {
    if (orders.length > 1) {
      // Keep one order with Confirmé, change others to Confirmé Double
      orders.slice(1).forEach((order) => {
        const orderRef = db.collection("orders").doc(order.id);
        batch.update(orderRef, { confirmationStatus: "Confirmé Double" });
        updateCount++;
      });
    }
  }

  if (updateCount > 0) {
    await batch.commit();
    console.log(`Updated ${updateCount} duplicate orders to "Confirmé Double".`);
  } else {
    console.log("No duplicate confirmed orders found.");
  }
}

//markDuplicateConfirmedOrders().catch(console.error);
async function findAndWriteDuplicateOrders() {
  const ordersSnapshot = await db.collection("orders").get();

  const phoneToOrders = {};

  ordersSnapshot.forEach((doc) => {
    const data = doc.data();
    const phone = data.phone;
    const name = data.name;
    const status = data.status;
    const id = doc.id;

    if (!phone || !name) return;

    if (!phoneToOrders[phone]) {
      phoneToOrders[phone] = [];
    }

    phoneToOrders[phone].push({ id, name, phone, status });
  });

  const duplicates = [];

  for (const phone in phoneToOrders) {
    const relatedOrders = phoneToOrders[phone];
    const uniqueNames = new Set(relatedOrders.map(order => order.name));

    if (uniqueNames.size > 1) {
      duplicates.push({
        phone,
        orders: relatedOrders
      });
    }
  }

  fs.writeFileSync("duplicates.json", JSON.stringify(duplicates, null, 2), "utf8");
  console.log("duplicates.json has been created.");
}
//indAndWriteDuplicateOrders()
async function findOrdersByShopifyShippingName() {
  const snapshot = await db.collection("Orders").get();

  const matchingOrderIds = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const shippingName = data.shopifyOrder?.shipping_address?.name;

    if (shippingName === "LAMAMARIA") {
      matchingOrderIds.push(doc.id);
    }
  });

  console.log("Matching Order IDs:", matchingOrderIds);
  return matchingOrderIds;
}
//findOrdersByShopifyShippingName()
async function countFilteredPendingOrders() {
  try {
    // Step 1: Get all orders with status 'en-attente'
    const snapshot = await db.collection('orders')
      .where('status', '==', 'en-attente')
      .get();

    // Step 2: Filter manually for confirmationStatus !== 'Double' && !== 'annule'
    const filteredOrders = snapshot.docs.filter(doc => {
      const confirmationStatus = doc.data().confirmationStatus;
      return confirmationStatus !== 'Double' && confirmationStatus !== 'annule' && confirmationStatus !== 'Reporté';
    });

    const count = filteredOrders.length;

    console.log(`Filtered pending orders count: ${count}`);
    return count;
  } catch (error) {
    console.error('Error counting filtered orders:', error);
    throw error;
  }
}


async function getConfirmationStatusCounts() {
  try {
    const snapshot = await db.collection('orders')
      .where('status', '==', 'en-attente')
      .get();

    const statusCounts = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const confirmationStatus = data.confirmationStatus || 'undefined';

      if (statusCounts[confirmationStatus]) {
        statusCounts[confirmationStatus]++;
      } else {
        statusCounts[confirmationStatus] = 1;
      }
    });

    console.log('Confirmation status counts:', statusCounts);
    return statusCounts;
  } catch (error) {
    console.error('Error retrieving confirmation status counts:', error);
    throw error;
  }
}

// Example usage
///getConfirmationStatusCounts();
async function updateMissingUpdatedAt() {
  const ordersRef = db.collection("orders");
  const snapshot = await ordersRef.get();

  const batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const docRef = ordersRef.doc(doc.id);

    if (!data.updatedAt && data.createdAt) {
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt
        : Timestamp.fromDate(new Date(data.createdAt));

      batch.update(docRef, { updatedAt: createdAt });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ updatedAt set for ${count} order(s).`);
  } else {
    console.log("ℹ️ No orders needed updating.");
  }
}

//updateMissingUpdatedAt().catch(console.error);
async function updateAnnuleToAnnulé() {
  const snapshot = await db
    .collection("orders")
    .where("confirmationStatus", "==", "annule")
    .get();

  if (snapshot.empty) {
    console.log("No matching orders found.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    const docRef = db.collection("orders").doc(doc.id);
    batch.update(docRef, { confirmationStatus: "Annulé" });
  });

  await batch.commit();
  console.log(`✅ Updated ${snapshot.size} order(s) from "annule" to "Annulé".`);
}
//updateAnnuleToAnnulé().catch(console.error);

async function updateTrackingHistoryAuthors() {
  const currentUser = "current-user"; // 👈 your target author value

  const trackingHistorySnapshot = await db
    .collection("trackingHistory")
    .where("author", "==", currentUser)
    .get();

  if (trackingHistorySnapshot.empty) {
    console.log("No trackingHistory entries with author === 'current-user'");
    return;
  }

  for (const doc of trackingHistorySnapshot.docs) {
    const data = doc.data();
    const docId = doc.id;
    const orderId = data.orderId;

    if (!orderId) continue;

    try {
      const orderSnap = await db.collection("orders").doc(orderId).get();

      if (!orderSnap.exists) {
        console.log(`❌ Order not found: ${orderId}`);
        continue;
      }

      const confirmatrice = orderSnap.data().confirmatrice;
      if (!confirmatrice) {
        console.log(`⚠️ No confirmatrice in order ${orderId}`);
        continue;
      }

      await db.collection("trackingHistory").doc(docId).update({
        author: confirmatrice,
      });

      console.log(`✅ Updated ${docId} author → ${confirmatrice}`);
    } catch (err) {
      console.error(`Error updating ${docId}:`, err);
    }
  }

  console.log("✅ Done updating relevant trackingHistory documents.");
}

async function updateVariantPrices(productId) {
  const productRef = db.collection('Products').doc(productId);
  const variantsRef = productRef.collection('variants');

  const snapshot = await variantsRef.get();

  if (snapshot.empty) {
    console.log(`No variants found for product ID: ${productId}`);
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    const variantRef = doc.ref;
    batch.update(variantRef, { price: "3200.00" });
  });

  await batch.commit();
  console.log(`Updated prices of ${snapshot.size} variants to "3200.00"`);
}
//updateVariantPrices("9659388920086").catch(console.error);
async function checkAndConfirmOrders() {
  const ordersSnap = await db.collection("orders").where("status", "==", "Repture").get();

  if (ordersSnap.empty) {
    console.log("No orders with status Repture.");
    return;
  }

  for (const doc of ordersSnap.docs) {
    const order = doc.data();
    const orderId = doc.id;
    const articles = order.articles || [];

    let allArticlesHaveEnoughStock = true;
    const variantRefs = [];
    const stockDeductions = [];

    // First pass: check all quantities
    for (const article of articles) {
      const { product_id, variant_id, quantity } = article;

      if (!product_id || !variant_id || !quantity) {
        allArticlesHaveEnoughStock = false;
        break;
      }

      const variantRef = db
        .collection("Products")
        .doc(product_id)
        .collection("variants")
        .doc(String(variant_id));

      const variantSnap = await variantRef.get();

      if (!variantSnap.exists) {
        allArticlesHaveEnoughStock = false;
        break;
      }

      const variant = variantSnap.data();
      const currentQty = variant.depots?.[0]?.quantity || 0;

      if (currentQty < quantity) {
        allArticlesHaveEnoughStock = false;
        break;
      }

      variantRefs.push(variantRef);
      stockDeductions.push({ quantityToDeduct: quantity });
    }

    // Second pass: confirm and deduct stock in transaction
    if (allArticlesHaveEnoughStock) {
      await db.runTransaction(async (transaction) => {
        // Deduct stock from each variant
        for (let i = 0; i < variantRefs.length; i++) {
          const ref = variantRefs[i];
          const snap = await transaction.get(ref);
          const data = snap.data();
          const currentQty = data.depots?.[0]?.quantity || 0;
          const newQty = Math.max(currentQty - stockDeductions[i].quantityToDeduct, 0);

          const updatedDepots = [...(data.depots || [])];
          updatedDepots[0].quantity = newQty;

          transaction.update(ref, { depots: updatedDepots });
        }

        // Update order status
        transaction.update(db.collection("orders").doc(orderId), {
          status: "Confirmé",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`✅ Order ${orderId} confirmed and stock updated.`);
    } else {
      console.log(`❌ Order ${orderId} still has insufficient stock.`);
    }
  }
}
//checkAndConfirmOrders().catch(console.error);