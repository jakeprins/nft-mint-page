import 'styles/tailwind.css'

import { AppProps } from 'next/app'
import { ToastProvider } from '@apideck/components'

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  )
}
