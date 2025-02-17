import { TAG, FORCE_TAG, CONTENT_PATH, ASSETS_PATH } from './config';
import { getLatestTag } from '@lib/github/api';
import { getRawFileFromRepo, getRawAssetFromRepo } from '@lib/github/raw';
import { isProd, removeFromLast } from '@utils/index';
import localManifest from '@content/docs/manifest.json';

export interface Route {
  title: string;
  subtitle?: string;
  section?: string;
  heading?: boolean;
  keywords?: string;
  icon?: string;
  open?: boolean;
  path?: string;
  routes?: Route[];
  updated?: boolean;
  newPost?: boolean;
}

export interface RouteContext {
  parent?: Route;
  route?: Route;
  nextRoute?: Route;
  prevRoute?: Route;
}

export interface Carry {
  params: { slug: any };
}

export async function getCurrentTag(tag?: string) {
  if (tag) return tag;
  if (FORCE_TAG) return TAG;
  return getLatestTag();
}

export function addTagToSlug(slug: string, tag?: string) {
  return tag ? slug.replace('/docs', `/docs/tag/${tag}`) : slug;
}

export async function fetchRawDoc(doc: string, tag: string) {
  return await getRawFileFromRepo(`${CONTENT_PATH}${doc}`, tag);
}

export async function fetchDocsManifest(tag: string) {
  if (!isProd) return localManifest;

  const res = await getRawFileFromRepo(
    `${CONTENT_PATH}/docs/manifest.json`,
    tag
  );
  return JSON.parse(res);
}

export function getRawAsset(doc: string, tag: string) {
  return getRawAssetFromRepo(`${ASSETS_PATH}${doc}`, tag);
}

export function findRouteByPath(
  path: string,
  routes: Route[]
): Route | null | undefined {
  for (const route of routes) {
    if (route.path && removeFromLast(route.path, '.') === path) {
      return route;
    }
    const childPath = route.routes ? findRouteByPath(path, route.routes) : null;
    if (childPath) return childPath;
  }
}

export function getPaths(
  nextRoutes: Route[],
  carry: Carry[] = [{ params: { slug: [] } }]
) {
  nextRoutes.forEach((route: Route) => {
    if (route.path) {
      carry.push(removeFromLast(route.path, '.') as Carry);
    } else if (route.routes) {
      getPaths(route.routes, carry);
    }
  });

  return carry;
}
