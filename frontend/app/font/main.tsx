import localFont from 'next/font/local';

export const creatoThinItalic = localFont({
  src: './CreatoDisplay-ThinItalic.otf',
  variable: '--font-creato-thinitalic',
});

export const creatoThin = localFont({
  src: './CreatoDisplay-Thin.otf',
  variable: '--font-creato-thin',
});

export const creatoLight = localFont({
  src: './CreatoDisplay-Light.otf',
  variable: '--font-creato-light',
});

export const creatoRegular = localFont({
  src: './CreatoDisplay-Regular.otf',
  variable: '--font-creato-regular',
});

export const creatoMedium = localFont({
  src: './CreatoDisplay-Medium.otf',
  variable: '--font-creato-medium',
});

export const creatoBold = localFont({
  src: './CreatoDisplay-Bold.otf',
  variable: '--font-creato-bold',
});

export const creatoExtraBold = localFont({
  src: './CreatoDisplay-ExtraBold.otf',
  variable: '--font-creato-extrabold',
});

export const creatoBlack = localFont({
  src: './CreatoDisplay-Black.otf',
  variable: '--font-creato-black',
});

export const fontVariables = [
  creatoThin.variable,
  creatoLight.variable,
  creatoRegular.variable,
  creatoMedium.variable,
  creatoBold.variable,
  creatoExtraBold.variable,
  creatoBlack.variable,
].join(' ');
