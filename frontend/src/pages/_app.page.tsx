import "../styles/globals.scss";
import { useEffect, useRef, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { LocalizationProvider, ReactLocalization } from "@fluent/react";
import { OverlayProvider } from "@react-aria/overlays";
import ReactGa from "react-ga";
import { getL10n } from "../functions/getL10n";
import { hasDoNotTrackEnabled } from "../functions/userAgent";
import { AddonDataContext, useAddonElementWatcher } from "../hooks/addon";
import { getRuntimeConfig } from "../config";
import { ReactAriaI18nProvider } from "../components/ReactAriaI18nProvider";
import { initialiseApiMocks } from "../apiMocks/initialise";
import { mockIds } from "../apiMocks/mockData";
import { useIsLoggedIn } from "../hooks/session";
import { useMetrics } from "../hooks/metrics";
import "@stripe/stripe-js";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const metricsEnabled = useMetrics();
  const addonDataElementRef = useRef<HTMLElement>(null);

  const addonData = useAddonElementWatcher(addonDataElementRef);
  const [l10n, setL10n] = useState<ReactLocalization>(
    getL10n({ deterministicLocales: true }),
  );

  useEffect(() => {
    // When pre-rendering and on the first render, we deterministically load the
    // `en` bundle.  After that, however, we want to load the bundles relevant
    // to the user's preferred locales. (See the `useL10n` hook for more detail
    // on why.) Unfortunately we can't load additional needed locales
    // asynchronously on the client-side yet using @fluent/react, see
    // https://github.com/projectfluent/fluent.js/wiki/ReactLocalization/43a959b35fbf9eea694367f948cfb1387914657c#flexibility
    setL10n(getL10n({ deterministicLocales: false }));
  }, []);

  useEffect(() => {
    if (hasDoNotTrackEnabled() || !metricsEnabled) {
      return;
    }
    ReactGa.initialize(getRuntimeConfig().googleAnalyticsId, {
      titleCase: false,
      debug: process.env.NEXT_PUBLIC_DEBUG === "true",
    });
    ReactGa.set({
      anonymizeIp: true,
      transport: "beacon",
    });
    const cookies = document.cookie.split("; ");
    const gaEventCookies = cookies.filter((item) =>
      item.trim().startsWith("server_ga_event:"),
    );
    gaEventCookies.forEach((item) => {
      const serverEventLabel = item.split("=")[1];
      if (serverEventLabel) {
        ReactGa.event({
          category: "server event",
          action: "fired",
          label: serverEventLabel,
        });
      }
    });
  }, [metricsEnabled]);

  useEffect(() => {
    if (hasDoNotTrackEnabled() || !metricsEnabled) {
      return;
    }
    ReactGa.pageview(router.asPath);
  }, [router.asPath, metricsEnabled]);

  const [waitingForMsw, setIsWaitingForMsw] = useState(
    process.env.NEXT_PUBLIC_MOCK_API === "true",
  );
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_API !== "true") {
      return;
    }
    (async () => {
      await initialiseApiMocks();

      if (
        typeof URLSearchParams !== "undefined" &&
        typeof document !== "undefined"
      ) {
        // When deploying the frontend with a mocked back-end,
        // this query parameter will allow us to automatically "sign in" with one
        // of the mock users. This is useful to be able to give testers a link
        // in which to see a particular feature:
        const searchParams = new URLSearchParams(document.location.search);
        const mockId = searchParams.get("mockId");
        const selectedMockId = mockIds.find((id) => id === mockId);
        if (typeof selectedMockId === "string") {
          // See `src/hooks/api/api.ts`; this localStorage entry is how we tell the
          // API mock what mock data we want to load:
          localStorage.setItem("authToken", selectedMockId);
        }
      }

      setIsWaitingForMsw(false);
    })();
  }, []);

  if (waitingForMsw) {
    // As soon as we start rendering the app, it will start sending requests.
    // If we're running the demo site, we want to hold off on doing that until
    // MSW is fully initialised. Usually, you'd run the initialisation before
    // rendering in the first place, but since Next.js handles the start of the
    // rendering (which it does to support server-side rendering), we're doing
    // it here instead. For more info, see
    // https://mswjs.io/docs/integrations/browser#conditionally-enable-mocking
    return <></>;
  }

  return (
    <LocalizationProvider l10n={l10n}>
      <ReactAriaI18nProvider>
        <AddonDataContext.Provider value={addonData}>
          <firefox-private-relay-addon
            ref={addonDataElementRef}
            // The following attributes are set by the add-on,
            // and read by the website (via the useAddonElementWatcher hook).
            data-addon-installed={addonData.present}
            data-local-labels={JSON.stringify(addonData.localLabels)}
            // The following attributes are set by the website,
            // and read by the add-on.
            // Capitalised boolean for backwards compatibility;
            // this element was previously generated by Django:
            data-user-logged-in={isLoggedIn ? "True" : "False"}
          ></firefox-private-relay-addon>
          <OverlayProvider id="overlayProvider">
            <Component {...pageProps} />
          </OverlayProvider>
        </AddonDataContext.Provider>
      </ReactAriaI18nProvider>
    </LocalizationProvider>
  );
}
export default MyApp;
