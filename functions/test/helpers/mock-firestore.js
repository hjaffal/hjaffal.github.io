/**
 * In-memory Firestore mock for testing.
 * Supports basic operations: collection, doc, get, set, update, delete, where queries.
 */

class MockDocumentSnapshot {
  constructor(id, data, ref) {
    this.id = id;
    this._data = data;
    this.exists = data !== undefined && data !== null;
    this.ref = ref || null;
  }

  data() {
    return this.exists ? { ...this._data } : undefined;
  }
}

class MockQuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.empty = docs.length === 0;
    this.size = docs.length;
  }

  forEach(callback) {
    this.docs.forEach(callback);
  }
}

class MockDocumentReference {
  constructor(store, collectionPath, docId) {
    this._store = store;
    this._collectionPath = collectionPath;
    this.id = docId;
    this.path = `${collectionPath}/${docId}`;
  }

  async get() {
    const collection = this._store[this._collectionPath] || {};
    const data = collection[this.id];
    return new MockDocumentSnapshot(this.id, data || null);
  }

  async set(data, options = {}) {
    if (!this._store[this._collectionPath]) {
      this._store[this._collectionPath] = {};
    }
    if (options.merge) {
      const existing = this._store[this._collectionPath][this.id] || {};
      this._store[this._collectionPath][this.id] = { ...existing, ...data };
    } else {
      this._store[this._collectionPath][this.id] = { ...data };
    }
  }

  async update(data) {
    if (!this._store[this._collectionPath]) {
      this._store[this._collectionPath] = {};
    }
    const existing = this._store[this._collectionPath][this.id];
    if (!existing) {
      throw new Error(`Document ${this.path} does not exist`);
    }
    this._store[this._collectionPath][this.id] = { ...existing, ...data };
  }

  async delete() {
    if (this._store[this._collectionPath]) {
      delete this._store[this._collectionPath][this.id];
    }
  }
}

class MockQuery {
  constructor(store, collectionPath, filters = [], orderByField = null, orderByDir = "asc", limitCount = null) {
    this._store = store;
    this._collectionPath = collectionPath;
    this._filters = filters;
    this._orderByField = orderByField;
    this._orderByDir = orderByDir;
    this._limitCount = limitCount;
  }

  where(field, operator, value) {
    const newFilters = [...this._filters, { field, operator, value }];
    return new MockQuery(this._store, this._collectionPath, newFilters, this._orderByField, this._orderByDir, this._limitCount);
  }

  orderBy(field, direction = "asc") {
    return new MockQuery(this._store, this._collectionPath, this._filters, field, direction, this._limitCount);
  }

  limit(count) {
    return new MockQuery(this._store, this._collectionPath, this._filters, this._orderByField, this._orderByDir, count);
  }

  async get() {
    const collection = this._store[this._collectionPath] || {};
    let docs = Object.entries(collection).map(
      ([id, data]) => new MockDocumentSnapshot(id, data, new MockDocumentReference(this._store, this._collectionPath, id))
    );

    // Apply filters
    for (const filter of this._filters) {
      docs = docs.filter((doc) => {
        const data = doc.data();
        if (!data) return false;
        const fieldValue = getNestedField(data, filter.field);
        return applyOperator(fieldValue, filter.operator, filter.value);
      });
    }

    // Apply ordering
    if (this._orderByField) {
      docs.sort((a, b) => {
        let aVal = getNestedField(a.data(), this._orderByField);
        let bVal = getNestedField(b.data(), this._orderByField);
        // Handle Firestore Timestamp-like objects with toDate()
        if (aVal && typeof aVal.toDate === "function") aVal = aVal.toDate();
        if (bVal && typeof bVal.toDate === "function") bVal = bVal.toDate();
        if (aVal < bVal) return this._orderByDir === "asc" ? -1 : 1;
        if (aVal > bVal) return this._orderByDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this._limitCount !== null) {
      docs = docs.slice(0, this._limitCount);
    }

    return new MockQuerySnapshot(docs);
  }
}

class MockCollectionReference extends MockQuery {
  constructor(store, collectionPath) {
    super(store, collectionPath);
  }

  doc(docId) {
    const id = docId || generateAutoId();
    return new MockDocumentReference(this._store, this._collectionPath, id);
  }

  async add(data) {
    const id = generateAutoId();
    if (!this._store[this._collectionPath]) {
      this._store[this._collectionPath] = {};
    }
    this._store[this._collectionPath][id] = { ...data };
    return new MockDocumentReference(this._store, this._collectionPath, id);
  }
}

class MockFirestore {
  constructor() {
    this._store = {};
  }

  collection(path) {
    return new MockCollectionReference(this._store, path);
  }

  /**
   * Directly seed data for testing.
   * @param {string} collectionPath - The collection path
   * @param {string} docId - The document ID
   * @param {object} data - The document data
   */
  seedDoc(collectionPath, docId, data) {
    if (!this._store[collectionPath]) {
      this._store[collectionPath] = {};
    }
    this._store[collectionPath][docId] = { ...data };
  }

  /**
   * Get all documents in a collection (for test assertions).
   */
  getAll(collectionPath) {
    return this._store[collectionPath] || {};
  }

  /**
   * Get a specific document's data (for test assertions).
   */
  getDoc(collectionPath, docId) {
    const collection = this._store[collectionPath] || {};
    return collection[docId] || null;
  }

  /**
   * Reset all data.
   */
  reset() {
    this._store = {};
  }
}

// Helper: get nested field value using dot notation
function getNestedField(obj, fieldPath) {
  const parts = fieldPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// Helper: apply Firestore query operators
function applyOperator(fieldValue, operator, filterValue) {
  switch (operator) {
    case "==":
      return fieldValue === filterValue;
    case "!=":
      return fieldValue !== filterValue;
    case "<":
      return fieldValue < filterValue;
    case "<=":
      return fieldValue <= filterValue;
    case ">":
      return fieldValue > filterValue;
    case ">=":
      return fieldValue >= filterValue;
    case "in":
      return Array.isArray(filterValue) && filterValue.includes(fieldValue);
    case "not-in":
      return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
    case "array-contains":
      return Array.isArray(fieldValue) && fieldValue.includes(filterValue);
    case "array-contains-any":
      return (
        Array.isArray(fieldValue) &&
        Array.isArray(filterValue) &&
        filterValue.some((v) => fieldValue.includes(v))
      );
    default:
      return false;
  }
}

// Helper: generate a random auto-ID similar to Firestore
function generateAutoId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Creates a fresh MockFirestore instance.
 */
function createMockFirestore() {
  return new MockFirestore();
}

module.exports = { MockFirestore, createMockFirestore };
