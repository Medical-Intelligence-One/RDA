import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import Demo from './autocomplete';

ReactDOM.createRoot(document.querySelector("#root")).render(
  <StyledEngineProvider injectFirst>
    <Demo />
  </StyledEngineProvider>
);