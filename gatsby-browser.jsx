import * as React from "react";
import { useEffect } from "react";

const INTERCEPT = true;

let resolveRouteUpdate = () => {};

const onNavigate = e => {
    const { hashChange, userInitiated, canIntercept, downloadRequest, formData } = e;

    if (!canIntercept ||
        !userInitiated ||
        downloadRequest ||
        formData ||
        hashChange) {
        return;
    }

    const { pathname, search } = new URL(e.destination.url);
    const url = pathname + search;

    const routeUpdatePs = new Promise(r => resolveRouteUpdate = r);

    console.log(`${url}: Intercepted`);

    e.intercept({
        focusReset: 'manual',
        scroll: 'manual',

        async handler() {
            console.log("%s", `${url}: Awaiting page resources`);

            // FIXME Not sure how I'd use this appropriately
            const pageResources = await window.___loader.loadPage(url);

            console.log("%s", `${url}: Loaded ${pageResources.page.path}`);
            console.log("%s", `${url}: Awaiting route update`);

            // FIXME Trigger refresh/listeners ?
            const update = await routeUpdatePs;

            console.log("%s", `${url}: Route updated ${update.location.pathname}`);
        }
    });
};

const interceptEnabled = () => INTERCEPT && window.navigation;

const intercept = () => {
    if (!interceptEnabled()) {
        return;
    }
    let ignore = false;
    const cb = e => {
        if (ignore) {
            return;
        }
        return onNavigate(e);
    };
    window.navigation.addEventListener('navigate', cb);
    return () => {
        ignore = true;
        window.navigation.removeEventListener('navigate', cb);
    };
};

const useIntercept = () => useEffect(intercept, []);

const Intercept = ({children}) => {
    useIntercept();
    return children;
};

export const wrapPageElement = ({element}) => <Intercept>{element}</Intercept>;

export const onRouteUpdate = (...x) => resolveRouteUpdate(...x);
