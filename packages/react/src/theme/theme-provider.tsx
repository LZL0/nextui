import React, { PropsWithChildren, useState, useMemo, useEffect } from 'react';
import CssBaseline from '../css-baseline';
import ThemeContext, { defaultContext } from './theme-context';
import withDefaults from '../utils/with-defaults';
import { CreateTheme, NextUIThemeContext, ThemeType } from './types';
import deepMerge from '../utils/deep-merge';
import { copyObject } from '../utils/object';
import { SsrProvider } from './ssr-provider';
import {
  changeTheme,
  getThemeName,
  getDocumentCSSTokens,
  getDocumentTheme
} from './utils';
import useSSR from '../use-ssr';

export interface Props {
  theme?: CreateTheme;
  disableBaseline?: boolean;
}

const defaultProps = {
  disableBaseline: false
};

export type ThemeProviderProps = Props & typeof defaultProps;

const ThemeProvider: React.FC<PropsWithChildren<ThemeProviderProps>> = ({
  theme: userTheme,
  disableBaseline,
  children
}) => {
  const { isBrowser } = useSSR();

  const [currentTheme, setCurrentTheme] = useState<ThemeType | string>(
    defaultContext.type
  );

  const changeCurrentTheme = (type: ThemeType | string) => {
    setCurrentTheme((ct) => (ct !== type ? type : ct));
  };

  const changeTypeBaseEl = (el: HTMLElement) => {
    const themeValue = getDocumentTheme(el);
    themeValue && changeCurrentTheme(themeValue);
  };

  const providerValue = useMemo<NextUIThemeContext>(() => {
    const themeTokens = isBrowser ? getDocumentCSSTokens() : {};
    const theme = deepMerge(copyObject(defaultContext.theme), themeTokens);
    const themeName = getThemeName(currentTheme);
    return {
      theme,
      type: themeName,
      isDark: themeName === 'dark'
    };
  }, [currentTheme, isBrowser]);

  useEffect(() => {
    // initial set
    changeTypeBaseEl(document?.documentElement);

    const observer = new MutationObserver((mutation) => {
      if (
        mutation &&
        mutation.length > 0 &&
        mutation[0]?.target.nodeName === 'BODY'
      ) {
        const documentTheme = document?.body?.dataset?.theme;
        documentTheme && changeCurrentTheme(documentTheme);
      } else {
        changeTypeBaseEl(document?.documentElement);
      }
    });

    observer.observe(document?.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style']
    });

    observer.observe(document?.body, {
      attributes: true,
      attributeFilter: ['data-theme', 'style']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isBrowser || !userTheme) {
      return;
    }
    if (userTheme?.className) {
      changeTheme(userTheme.className);
      changeCurrentTheme(getThemeName(userTheme.className));
    }
  }, [isBrowser, userTheme]);

  return (
    <SsrProvider>
      <ThemeContext.Provider value={providerValue}>
        {!disableBaseline && <CssBaseline />}
        {children}
      </ThemeContext.Provider>
    </SsrProvider>
  );
};

export default withDefaults(ThemeProvider, defaultProps);
