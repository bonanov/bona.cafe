// Stores the central state of the web application

import { setID } from "../db";
import { Post, PostCollection } from "../posts";
import { getClosestID, getUnique } from "../util";

// Server-wide global configurations
interface Config {
    maxSize: number;
    maxFiles: number;
    defaultCSS: string;
    imageRootOverride: string;
}

// Board-specific configurations
export interface BoardConfig {
    id: string;
    title: string;
    readOnly?: boolean;
}

// The current state of a board or thread page
export interface PageState {
    landing: boolean;
    stickers: boolean;
    admin: string;
    catalog: boolean;
    thread: number;
    lastN: number;
    page: number;
    board: string;
    href: string;
}

// Retrieve model of closest parent post
export function getModel(el: Element): Post {
    const id = getClosestID(el);
    if (!id) return null;
    return posts.get(id);
}

// Read page state by parsing a URL
function getState(href: string): PageState {
    const u = document.createElement("a");
    u.href = href;

    // WTF, IE?
    // https://stackoverflow.com/a/956376
    let pathname = u.pathname;
    if (!pathname.startsWith("/")) {
        pathname = "/" + pathname;
    }

    const admin = pathname.match(/^\/admin\/(\w+)?/);
    const thread = pathname.match(/^\/\w+\/(\d+)/);
    const pageN = u.search.match(/[&\?]page=(\d+)/);

    return {
        board: pathname.match(/^\/(\w+)?\/?/)[1],
        catalog: /^\/\w+\/catalog/.test(pathname),
        href,
        landing: pathname === "/",
        stickers: pathname.startsWith("/stickers/"),
        admin: admin ? (admin[1] || "all") : "",
        lastN: /[&\?]last=100/.test(u.search) ? 100 : 0,
        page: pageN ? parseInt(pageN[1], 10) : 0,
        thread: parseInt(thread && thread[1], 10) || 0,
    };
}

// Load initial page state
export const page = getState(location.href);

// Configuration passed from the server. Some values can be changed during
// runtime.
export const config: Config = (window as any).config;

// Currently existing boards
export let boards: BoardConfig[] = (window as any).boards;

// All posts currently displayed
export const posts = new PostCollection();

// Posts I made in any tab
export const mine: Set<number> = new Set();

function loadMine() {
    try {
        return JSON.parse(localStorage.mine);
    } catch (e) {
        return [];
    }
}

// Load post number sets
export function loadPostStores() {
    const ids = loadMine();
    for (const id of ids) {
        mine.add(id);
    }
}

// Store the ID of a post this client created
export function storeMine(id: number, op: number) {
    mine.add(id);
    const ids = Array.from(mine);
    localStorage.mine = JSON.stringify(ids);
    // Save in second storage just for possible future purposes.
    setID("mine", id, op);
}
// sha1: "2339deac4dd6b855fa207af90c5bd30948e6c5ca"
// fileType: 0
// board: "kpop"
// name: "bn_1"
// ID: 28
export interface Smile {
    sha1: string;
    fileType?: number;
    board?: string;
    name: string;
    id?: number;
}

export function storeSmiles(smiles: Smile[], board: string) {
    localStorage[board + "_smiles"] = JSON.stringify(smiles);
}
export function loadSmiles(board: string): Smile[] {
    try {
        return JSON.parse(localStorage[board + "_smiles"]);
    } catch (error) {
        return [];
    }
}

/**
 * Returns board's and global smiles. Board's is always first.
 */
export function loadSmilesWithGlobal(board?: string, sort?: boolean): Smile[] {
    const smiles = [...loadSmiles(board || page.board), ...loadSmiles("all")];

    if (sort) {
        smiles.sort((a, b) => {
            // Natural sorting
            // TODO: Move to utils
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
                ? 1
                : -1;
        });
    }

    return getUnique(smiles, "name");
}

export function getSmileByItsName(name: string, list?: Smile[]) {
    const initialList = list || loadSmilesWithGlobal();
    return initialList.find((s) => s.name === name);
}

window.addEventListener("storage", loadPostStores);
