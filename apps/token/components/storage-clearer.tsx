"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { env } from "@/common/config/env";

const DEPLOYMENT_ID_STORAGE_KEY = "__mjs_deployment_id";

/**
 * Clears all cookies for the current domain.
 * Attempts to clear cookies at various common paths.
 */
function clearAllCookies(): void {
  const hostname = window.location.hostname;
  const paths = ["/", "/dashboard", "/onboarding", "/in"];
  const domains = [hostname, `.${hostname}`];
  const pastDate = new Date(0).toUTCString();
  const cookieNames = new Set<string>();
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      cookieNames.add(name);
    }
  });
  domains.forEach((domain) => {
    paths.forEach((path) => {
      cookieNames.forEach((name) => {
        document.cookie = `${name}=; expires=${pastDate}; path=${path}; domain=${domain}`;
        document.cookie = `${name}=; expires=${pastDate}; path=${path}`;
      });
    });
  });
}

/**
 * Clears all IndexedDB databases.
 */
async function clearIndexedDB(): Promise<void> {
  try {
    if (typeof indexedDB !== "undefined" && indexedDB.databases) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map((db) => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteRequest = indexedDB.deleteDatabase(db.name!);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
              deleteRequest.onblocked = () => resolve();
            });
          }
          return Promise.resolve();
        }),
      );
    }
  } catch (error) {
    console.warn("Failed to clear IndexedDB:", error);
  }
}

/**
 * Clears all Cache API caches.
 */
async function clearCacheAPI(): Promise<void> {
  try {
    if (typeof caches !== "undefined") {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (error) {
    console.warn("Failed to clear Cache API:", error);
  }
}

/**
 * Clears all browser storage: cookies, localStorage, sessionStorage, IndexedDB, and Cache API.
 */
async function clearAllStorage(router: AppRouterInstance): Promise<void> {
  console.debug("===============================================");
  console.debug("= Clearing all storage");
  console.debug("===============================================");
  clearAllCookies();
  localStorage.clear();
  sessionStorage.clear();
  // await clearIndexedDB();
  await clearCacheAPI();
  router.push("/");
  router.refresh();
}

/**
 * Storage clearing component that runs on mount.
 * Compares current deployment ID with stored deployment ID.
 * If they differ and the feature flag is enabled, clears all storage.
 */
export function StorageClearer({ deploymentId }: { deploymentId: string }) {

  const router = useRouter();
  const [storedDeploymentId, setStoredDeploymentId] = useLocalStorage<
    string | null
  >(DEPLOYMENT_ID_STORAGE_KEY, null);
  useEffect(() => {
    const isEnabled = env.NEXT_PUBLIC_CLEAR_STORAGE_ON_DEPLOYMENT;
    if (!isEnabled) {
      return;
    }
    const currentDeploymentId = deploymentId || "unknown";

    console.log("🚀 ~ storage-clearer.tsx:116 ~ currentDeploymentId:", currentDeploymentId);
    console.log("🚀 ~ storage-clearer.tsx:119 ~ storedDeploymentId:", storedDeploymentId);

    if (
      storedDeploymentId === null ||
      storedDeploymentId !== currentDeploymentId
    ) {
      clearAllStorage(router)
        .then(() => {
          setStoredDeploymentId(currentDeploymentId);
          console.info(
            `Storage cleared due to deployment change. Previous: ${storedDeploymentId || "none"}, Current: ${currentDeploymentId}`,
          );
        })
        .catch((error) => {
          console.error("Failed to clear storage:", error);
        });
    }
  }, [deploymentId, storedDeploymentId, setStoredDeploymentId]);
  return null;
}
