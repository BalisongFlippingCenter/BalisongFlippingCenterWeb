import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { AppStore } from "../redux/store";
import { makeTestStore } from "./testStore";

export function renderWithProviders(ui: ReactElement, store: AppStore = makeTestStore() as unknown as AppStore) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}
