/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { screen, getByTestId, getAllByTestId, getByText, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("When I click on the button 'Nouvelle note de frais'", () => {
  test("Then I should navigate to #employee/bill/new", () => {
    // Vérifie qu'on arrive bien sur la page NewBill
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const billsPage = new Bills({
      document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
    })
    // on récupère la fonction pour le test
    const handleClickNewBill = jest.fn(billsPage.handleClickNewBill);
    // on récupère l'accès au bouton qui dirige vers la page souhaitée
    const btnNewBill = getByTestId(document.body, "btn-new-bill");
    // on simule l'action
    btnNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(btnNewBill);
    // on vérifie que la fonction est appelée et que la page souhaitée s'affiche
    expect(handleClickNewBill).toHaveBeenCalled();
    expect(
      getByText(document.body, "Envoyer une note de frais")
    ).toBeTruthy();
  });
});
