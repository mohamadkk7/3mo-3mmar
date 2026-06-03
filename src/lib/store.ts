import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { BlobError, get, put } from "@vercel/blob";

export type Unit = "kg" | "l";

export type StoredMaterial = {
  id: string;
  name: string;
  unit: Unit;
  pricePerUnit: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredIngredient = {
  id: string;
  materialId: string;
  quantity: number;
};

export type StoredProduct = {
  id: string;
  name: string;
  outputQuantity: number;
  ingredients: StoredIngredient[];
  createdAt: string;
  updatedAt: string;
};

export type AppStore = {
  version: 1;
  materials: StoredMaterial[];
  products: StoredProduct[];
};

export type MaterialWithUsage = StoredMaterial & { usedIn: number };

export type ExpandedIngredient = StoredIngredient & {
  material: StoredMaterial;
};

export type ExpandedProduct = Omit<StoredProduct, "ingredients"> & {
  ingredients: ExpandedIngredient[];
};

const STORE_PATHNAME = "factory-data/store.json";
const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "store.json");

export class StorePersistenceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StorePersistenceError";
  }
}

function createDefaultStore(): AppStore {
  return {
    version: 1,
    materials: [],
    products: [],
  };
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function normalizeBlobStoreId(storeId: string): string {
  return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId;
}

function getBlobStoreId(): string | null {
  const envStoreId = process.env.BLOB_STORE_ID?.trim();
  if (envStoreId) {
    return normalizeBlobStoreId(envStoreId);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return null;
  }

  const [, , , storeId = ""] = token.split("_");
  return storeId ? normalizeBlobStoreId(storeId) : null;
}

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function getBlobReadTarget(): string {
  const storeId = getBlobStoreId();
  if (!storeId) {
    return STORE_PATHNAME;
  }

  const cacheBust = `ts=${Date.now()}`;
  return `https://${storeId}.private.blob.vercel-storage.com/${STORE_PATHNAME}?${cacheBust}`;
}

function normalizeStore(input: unknown): AppStore {
  if (!input || typeof input !== "object") {
    return createDefaultStore();
  }

  const store = input as Partial<AppStore>;
  return {
    version: 1,
    materials: Array.isArray(store.materials) ? store.materials : [],
    products: Array.isArray(store.products) ? store.products : [],
  };
}

async function readLocalStore(): Promise<AppStore> {
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createDefaultStore();
    }
    throw error;
  }
}

async function writeLocalStore(store: AppStore): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function readBlobStore(): Promise<AppStore> {
  try {
    const blob = await get(getBlobReadTarget(), {
      access: "private",
      useCache: false,
    });
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return createDefaultStore();
    }

    const raw = await new Response(blob.stream).text();
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    if (error instanceof BlobError) {
      return createDefaultStore();
    }
    throw error;
  }
}

async function writeBlobStore(store: AppStore): Promise<void> {
  try {
    await put(STORE_PATHNAME, JSON.stringify(store), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  } catch (error) {
    throw new StorePersistenceError(
      "تعذر حفظ البيانات في تخزين Vercel Blob. تحقق من إعدادات التخزين في Vercel.",
      { cause: error }
    );
  }
}

async function readStore(): Promise<AppStore> {
  return hasBlobStorage() ? readBlobStore() : readLocalStore();
}

async function writeStore(store: AppStore): Promise<void> {
  if (hasBlobStorage()) {
    await writeBlobStore(store);
    return;
  }

  if (isVercelRuntime()) {
    throw new StorePersistenceError(
      "التخزين غير مهيأ على Vercel. من لوحة Vercel افتح Storage ثم أنشئ Blob واربطه بالمشروع، وبعدها أعد النشر. أو أضف BLOB_READ_WRITE_TOKEN أو BLOB_STORE_ID في Environment Variables."
    );
  }

  await writeLocalStore(store);
}

function byCreatedAsc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  );
}

function byUpdatedDesc<T extends { updatedAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

function expandProducts(
  products: StoredProduct[],
  materials: StoredMaterial[]
): ExpandedProduct[] {
  const materialMap = new Map(materials.map((material) => [material.id, material]));

  return products.map((product) => ({
    ...product,
    ingredients: product.ingredients
      .map((ingredient) => {
        const material = materialMap.get(ingredient.materialId);
        if (!material) return null;
        return {
          ...ingredient,
          material,
        };
      })
      .filter((ingredient): ingredient is ExpandedIngredient => ingredient !== null),
  }));
}

export async function listMaterials(): Promise<StoredMaterial[]> {
  const store = await readStore();
  return byCreatedAsc(store.materials);
}

export async function listMaterialsWithUsage(): Promise<MaterialWithUsage[]> {
  const store = await readStore();
  return byCreatedAsc(store.materials).map((material) => ({
    ...material,
    usedIn: store.products.filter((product) =>
      product.ingredients.some((ingredient) => ingredient.materialId === material.id)
    ).length,
  }));
}

export async function countMaterials(): Promise<number> {
  const store = await readStore();
  return store.materials.length;
}

export async function createMaterial(input: {
  name: string;
  unit: Unit;
  pricePerUnit: number;
}): Promise<StoredMaterial> {
  const store = await readStore();
  const now = new Date().toISOString();
  const material: StoredMaterial = {
    id: randomUUID(),
    name: input.name,
    unit: input.unit,
    pricePerUnit: input.pricePerUnit,
    createdAt: now,
    updatedAt: now,
  };

  store.materials.push(material);
  await writeStore(store);
  return material;
}

export async function updateMaterial(
  id: string,
  patch: Partial<Pick<StoredMaterial, "name" | "unit" | "pricePerUnit">>
): Promise<StoredMaterial | null> {
  const store = await readStore();
  const material = store.materials.find((item) => item.id === id);
  if (!material) return null;

  if (patch.name !== undefined) material.name = patch.name;
  if (patch.unit !== undefined) material.unit = patch.unit;
  if (patch.pricePerUnit !== undefined) {
    material.pricePerUnit = patch.pricePerUnit;
  }
  material.updatedAt = new Date().toISOString();

  await writeStore(store);
  return material;
}

export async function deleteMaterial(id: string): Promise<{
  ok: boolean;
  usedIn: number;
}> {
  const store = await readStore();
  const usedIn = store.products.filter((product) =>
    product.ingredients.some((ingredient) => ingredient.materialId === id)
  ).length;

  if (usedIn > 0) {
    return { ok: false, usedIn };
  }

  const nextMaterials = store.materials.filter((item) => item.id !== id);
  if (nextMaterials.length === store.materials.length) {
    return { ok: false, usedIn: 0 };
  }

  store.materials = nextMaterials;
  await writeStore(store);
  return { ok: true, usedIn: 0 };
}

export async function listProductsExpanded(options?: {
  order?: "createdAsc" | "updatedDesc";
}): Promise<ExpandedProduct[]> {
  const store = await readStore();
  const ordered =
    options?.order === "updatedDesc"
      ? byUpdatedDesc(store.products)
      : byCreatedAsc(store.products);

  return expandProducts(ordered, store.materials);
}

export async function getProductExpandedById(
  id: string
): Promise<ExpandedProduct | null> {
  const store = await readStore();
  const product = store.products.find((item) => item.id === id);
  if (!product) return null;
  return expandProducts([product], store.materials)[0] ?? null;
}

export async function getProductById(id: string): Promise<StoredProduct | null> {
  const store = await readStore();
  return store.products.find((item) => item.id === id) ?? null;
}

export async function listProductEditorData(): Promise<{
  materials: StoredMaterial[];
}> {
  const materials = await listMaterials();
  return { materials };
}

export async function createProduct(input: {
  name: string;
  outputQuantity: number;
  ingredients: Array<{ materialId: string; quantity: number }>;
}): Promise<StoredProduct | null> {
  const store = await readStore();
  const materialIds = new Set(store.materials.map((material) => material.id));

  if (!input.ingredients.every((ingredient) => materialIds.has(ingredient.materialId))) {
    return null;
  }

  const now = new Date().toISOString();
  const product: StoredProduct = {
    id: randomUUID(),
    name: input.name,
    outputQuantity: input.outputQuantity,
    ingredients: input.ingredients.map((ingredient) => ({
      id: randomUUID(),
      materialId: ingredient.materialId,
      quantity: ingredient.quantity,
    })),
    createdAt: now,
    updatedAt: now,
  };

  store.products.push(product);
  await writeStore(store);
  return product;
}

export async function updateProduct(
  id: string,
  input: {
    name: string;
    outputQuantity: number;
    ingredients: Array<{ materialId: string; quantity: number }>;
  }
): Promise<StoredProduct | null> {
  const store = await readStore();
  const product = store.products.find((item) => item.id === id);
  if (!product) return null;

  const materialIds = new Set(store.materials.map((material) => material.id));
  if (!input.ingredients.every((ingredient) => materialIds.has(ingredient.materialId))) {
    return null;
  }

  product.name = input.name;
  product.outputQuantity = input.outputQuantity;
  product.ingredients = input.ingredients.map((ingredient) => ({
    id: randomUUID(),
    materialId: ingredient.materialId,
    quantity: ingredient.quantity,
  }));
  product.updatedAt = new Date().toISOString();

  await writeStore(store);
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = await readStore();
  const nextProducts = store.products.filter((item) => item.id !== id);
  if (nextProducts.length === store.products.length) {
    return false;
  }

  store.products = nextProducts;
  await writeStore(store);
  return true;
}
