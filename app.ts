/**
 * Application entry point.
 */

// tslint:disable-next-line:no-reference
/// <reference path="ts/util/dom4.d.ts" />
// tslint:disable-next-line:no-reference
/// <reference path="ts/util/jsx.d.ts" />
// tslint:disable-next-line:no-reference
/// <reference path="ts/util/modules.d.ts" />

// FIXME(Kagami): Circular imports, must go before client module.
import { init as initOptions } from "./ts/options";

import { init as initAdmin } from "./ts/admin";
import { init as initAlerts, showAlert } from "./ts/alerts";
import { init as initAuth } from "./ts/auth";
import { init as initHandlers } from "./ts/client";
import { init as initConnection } from "./ts/connection";
import { init as initDB } from "./ts/db";
import { _, init as initLang } from "./ts/lang";
import { renderBoard, renderThread } from "./ts/page";
import { init as initPosts } from "./ts/posts";
import { loadPostStores, page } from "./ts/state";
import { init as initUI } from "./ts/ui";

// Load all stateful modules in dependency order.
async function init() {
    initAlerts();
    initOptions();
    initLang();

    await initDB();
    loadPostStores();

    if (page.landing) {
        /* skip */
    } else if (page.stickers) {
        /* skip */
    } else if (page.admin) {
        initAdmin();
    } else if (page.thread) {
        renderThread();
        initConnection();
        initHandlers();
        initPosts();
    } else if (page.board) {
        renderBoard();
        if (!page.catalog) {
            initPosts();
        }
    }

    initUI();
    initAuth();
}

init().catch((err) => {
    // tslint:disable-next-line:no-console
    console.error(err);
    showAlert({
        message: err.message,
        sticky: true,
        title: _("initErr"),
    });
});
